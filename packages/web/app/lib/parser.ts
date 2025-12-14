import type { ConversationMessage, Conversation, Project, AssistantMessage, TextBlock } from './types';
import { log } from './logger';

/**
 * Type guard to check if a message is an AssistantMessage
 */
function isAssistantMessage(message: ConversationMessage['message']): message is AssistantMessage {
  return 'model' in message && 'usage' in message;
}

/**
 * Parse a JSONL file into conversation messages
 */
export async function parseJSONLFile(file: File): Promise<ConversationMessage[]> {
  const text = await file.text();
  const lines = text.split('\n').filter(line => line.trim());

  return lines
    .map(line => {
      try {
        return JSON.parse(line) as ConversationMessage;
      } catch (error) {
        log.error('Failed to parse line:', error, { line });
        return null;
      }
    })
    .filter((msg): msg is ConversationMessage => msg !== null);
}

/**
 * Extract a preview from conversation messages (first user message)
 */
export function extractPreview(messages: ConversationMessage[]): string {
  const firstUserMessage = messages.find(msg => msg.type === 'user');

  if (!firstUserMessage) return 'No user messages';

  const content = firstUserMessage.message.content;

  if (typeof content === 'string') {
    return content.substring(0, 100);
  }

  if (Array.isArray(content)) {
    const textContent = content.find(c => c.type === 'text') as TextBlock | undefined;
    return textContent?.text?.substring(0, 100) || 'No text content';
  }

  return 'Unknown content type';
}

/**
 * Extract model information from messages
 */
export function extractModel(messages: ConversationMessage[]): string | undefined {
  const assistantMessage = messages.find(msg => msg.type === 'assistant');

  if (assistantMessage && isAssistantMessage(assistantMessage.message)) {
    return assistantMessage.message.model;
  }

  return undefined;
}

/**
 * Calculate total tokens from messages
 */
export function calculateTokens(messages: ConversationMessage[]): {
  total: number;
  input: number;
  output: number;
} {
  let input = 0;
  let output = 0;

  messages.forEach(msg => {
    if (isAssistantMessage(msg.message)) {
      const usage = msg.message.usage;
      if (usage) {
        input += usage.input_tokens || 0;
        output += usage.output_tokens || 0;
      }
    }
  });

  return {
    total: input + output,
    input,
    output
  };
}

/**
 * Parse project name from folder name
 * e.g., "-Users-dmg-career" -> "career"
 */
export function parseProjectName(folderName: string): string {
  // Remove leading dash and split by dashes
  const parts = folderName.replace(/^-/, '').split('-');

  // Take the last part as the project name
  return parts[parts.length - 1] || folderName;
}

/**
 * Load a single project directory
 */
export async function loadProject(
  directoryHandle: FileSystemDirectoryHandle
): Promise<Project> {
  const conversations: Conversation[] = [];

  for await (const entry of directoryHandle.values()) {
    if (entry.kind === 'file' && entry.name.endsWith('.jsonl')) {
      try {
        const fileHandle = entry as FileSystemFileHandle;
        const file = await fileHandle.getFile();
        const messages = await parseJSONLFile(file);

        if (messages.length === 0) continue;

        const tokens = calculateTokens(messages);

        conversations.push({
          sessionId: messages[0]?.sessionId || '',
          uuid: entry.name.replace('.jsonl', ''),
          timestamp: new Date(messages[0]?.timestamp || 0),
          messageCount: messages.length,
          preview: extractPreview(messages),
          type: messages[0]?.type || 'user',
          messages,
          model: extractModel(messages),
          totalTokens: tokens.total,
          inputTokens: tokens.input,
          outputTokens: tokens.output,
        });
      } catch (error) {
        log.error(`Failed to parse file ${entry.name}:`, error);
      }
    }
  }

  // Sort conversations by timestamp (newest first)
  conversations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return {
    id: directoryHandle.name,
    displayName: parseProjectName(directoryHandle.name),
    conversationCount: conversations.length,
    lastModified: conversations.length > 0
      ? conversations[0].timestamp
      : new Date(),
    path: directoryHandle.name,
    conversations,
  };
}

/**
 * Load all projects from the .claude/projects directory
 */
export async function loadAllProjects(
  rootHandle: FileSystemDirectoryHandle
): Promise<Project[]> {
  const projects: Project[] = [];

  for await (const entry of rootHandle.values()) {
    if (entry.kind === 'directory') {
      try {
        const dirHandle = entry as FileSystemDirectoryHandle;
        const project = await loadProject(dirHandle);

        if (project.conversationCount > 0) {
          projects.push(project);
        }
      } catch (error) {
        log.error(`Failed to load project ${entry.name}:`, error);
      }
    }
  }

  // Sort projects by last modified (newest first)
  projects.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

  return projects;
}
