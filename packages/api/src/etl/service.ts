import { getDb, schema } from '@/db/client';
import { eq } from 'drizzle-orm';
import * as fs from 'fs/promises';
import * as path from 'path';
import os from 'os';
import { log } from '@/logger';
import { withTimeout } from '@/utils/timeout';
import { TIMEOUTS } from '@/utils/constants';
import type {
  ConversationMessage,
  ContentBlock,
  AssistantMessage,
  TextBlock,
  ToolUseBlock,
  ToolResultBlock,
  ThinkingBlock
} from '@rewind/shared';

// Type guard for assistant messages
function isAssistantMessage(msg: ConversationMessage['message']): msg is AssistantMessage {
  return msg != null && typeof msg === 'object' && 'usage' in msg && 'model' in msg;
}

// Extract text content from content blocks for search indexing
function extractTextFromContent(content: string | ContentBlock[]): string {
  if (typeof content === 'string') {
    return content;
  }

  return content
    .map(block => {
      if (block.type === 'text') return block.text;
      if (block.type === 'thinking') return block.thinking;
      return '';
    })
    .filter(Boolean)
    .join(' ');
}

export type ETLProgressEvent = {
  type: 'start' | 'project' | 'conversation' | 'complete' | 'error' | 'info';
  message: string;
  data?: {
    projectName?: string;
    fileName?: string;
    messageCount?: number;
    totalProjects?: number;
    totalConversations?: number;
    error?: string;
  };
  timestamp: string;
};

export type ETLProgressCallback = (event: ETLProgressEvent) => void;

export class ETLService {
  private db = getDb();
  private rewindPath: string;
  private progressCallback?: ETLProgressCallback;

  constructor(progressCallback?: ETLProgressCallback) {
    this.rewindPath = '';
    this.progressCallback = progressCallback;
  }

  private emitProgress(event: Omit<ETLProgressEvent, 'timestamp'>) {
    if (this.progressCallback) {
      this.progressCallback({
        ...event,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async getRewindPath(): Promise<string> {
    if (this.rewindPath) {
      return this.rewindPath;
    }

    // Try to get from database settings first
    const setting = await this.db.query.settings.findFirst({
      where: eq(schema.settings.key, 'rewind_data_path'),
    });

    let configuredPath = setting?.value || process.env.REWIND_DATA_PATH || '';

    if (!configuredPath) {
      throw new Error('Rewind data path not configured. Please set it in Settings.');
    }

    // Expand ~ to home directory
    if (configuredPath.startsWith('~')) {
      configuredPath = path.join(os.homedir(), configuredPath.slice(1));
    }

    this.rewindPath = configuredPath;
    return this.rewindPath;
  }

  async run() {
    log.info('🚀 Starting ETL process...');
    this.emitProgress({
      type: 'start',
      message: 'Starting ETL process...',
    });

    // Get the configured path
    const rewindPath = await this.getRewindPath();
    log.info(`📁 Scanning: ${rewindPath}`);
    this.emitProgress({
      type: 'info',
      message: `Scanning directory: ${rewindPath}`,
    });

    try {
      await this.extractAndTransform();
      log.info('✅ ETL process completed successfully');
      this.emitProgress({
        type: 'complete',
        message: 'ETL process completed successfully',
      });
    } catch (error) {
      log.error('❌ ETL process failed:', error);
      this.emitProgress({
        type: 'error',
        message: `ETL process failed: ${error instanceof Error ? error.message : String(error)}`,
        data: { error: String(error) },
      });
      throw error;
    }
  }

  private async extractAndTransform() {
    const projectDirs = await this.getProjectDirectories();
    log.info(`📊 Found ${projectDirs.length} projects`);
    this.emitProgress({
      type: 'info',
      message: `Found ${projectDirs.length} projects to process`,
      data: { totalProjects: projectDirs.length },
    });

    for (const projectDir of projectDirs) {
      await this.processProject(projectDir);
    }
  }

  private async getProjectDirectories(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.rewindPath, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(this.rewindPath, entry.name));
    } catch (error) {
      log.error('Error reading Rewind directory:', error);
      return [];
    }
  }

  private async processProject(projectPath: string) {
    const projectName = path.basename(projectPath);
    log.info(`  📦 Processing project: ${projectName}`);
    this.emitProgress({
      type: 'project',
      message: `Processing project: ${projectName}`,
      data: { projectName },
    });

    // Upsert project
    const [project] = await this.db
      .insert(schema.projects)
      .values({
        name: projectName,
        path: projectPath,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.projects.path,
        set: {
          name: projectName,
          updatedAt: new Date(),
          lastScannedAt: new Date(),
        },
      })
      .returning();

    // Process conversation files
    const conversationFiles = await this.getConversationFiles(projectPath);
    log.info(`    💬 Found ${conversationFiles.length} conversations`);
    this.emitProgress({
      type: 'info',
      message: `Found ${conversationFiles.length} conversations in ${projectName}`,
      data: { projectName, totalConversations: conversationFiles.length },
    });

    for (const filePath of conversationFiles) {
      await this.processConversation(filePath, project.id);
    }
  }

  private async getConversationFiles(projectPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(projectPath);
      return entries
        .filter(file => file.endsWith('.jsonl'))
        .map(file => path.join(projectPath, file));
    } catch (error) {
      log.error(`Error reading project directory ${projectPath}:`, error);
      return [];
    }
  }

  private async processConversation(filePath: string, projectId: string) {
    try {
      // Check if file was already processed and hasn't changed (with timeout)
      const stats = await withTimeout(
        fs.stat(filePath),
        TIMEOUTS.FILE_STAT,
        `File stat operation timed out for ${filePath}`
      );
      const fileModTime = stats.mtime;

      const existingFile = await this.db.query.processedFiles.findFirst({
        where: eq(schema.processedFiles.filePath, filePath),
      });

      if (existingFile && existingFile.lastModified >= fileModTime) {
        // File hasn't changed, skip processing
        return;
      }

      // Read and parse JSONL file (with timeout)
      const fileContent = await withTimeout(
        fs.readFile(filePath, 'utf-8'),
        TIMEOUTS.FILE_READ,
        `File read operation timed out for ${filePath}`
      );

      // Parse JSONL - each line is a separate JSON object
      const lines = fileContent.trim().split('\n');
      const messages: ConversationMessage[] = [];

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line) as ConversationMessage;
          // Only include messages with a UUID (skip queue-operation, file-history-snapshot, etc.)
          if (msg.uuid) {
            messages.push(msg);
          }
        } catch (parseError) {
          log.warn(`Failed to parse line in ${filePath}:`, parseError);
        }
      }

      if (messages.length === 0) {
        log.warn(`No valid messages in ${filePath}`);
        return;
      }

      // Use first message UUID as conversation ID
      const conversationId = messages[0].uuid;
      const firstMessage = messages[0];
      const lastMessage = messages[messages.length - 1];

      // Calculate conversation-level statistics
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let lastModel: string | undefined;
      const sessionId = firstMessage.sessionId;

      for (const msg of messages) {
        if (isAssistantMessage(msg.message)) {
          totalInputTokens += msg.message.usage.input_tokens || 0;
          totalOutputTokens += msg.message.usage.output_tokens || 0;
          lastModel = msg.message.model;
        }
      }

      const totalTokens = totalInputTokens + totalOutputTokens;

      // Generate title from first user message
      const title = this.generateTitle(messages);

      // Upsert conversation
      const [dbConversation] = await this.db
        .insert(schema.conversations)
        .values({
          projectId,
          conversationId,
          sessionId,
          title,
          model: lastModel,
          totalTokens,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          createdAt: new Date(firstMessage.timestamp),
          updatedAt: new Date(lastMessage.timestamp),
        })
        .onConflictDoUpdate({
          target: schema.conversations.conversationId,
          set: {
            sessionId,
            title,
            model: lastModel,
            totalTokens,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            updatedAt: new Date(lastMessage.timestamp),
          },
        })
        .returning();

      // Delete existing messages and content blocks (cascade will handle content blocks)
      await this.db
        .delete(schema.messages)
        .where(eq(schema.messages.conversationId, dbConversation.id));

      // Insert messages with full data
      for (const msg of messages) {
        const messageContent = typeof msg.message.content === 'string'
          ? msg.message.content
          : extractTextFromContent(msg.message.content);

        let inputTokens: number | undefined;
        let outputTokens: number | undefined;
        let cacheCreationTokens: number | undefined;
        let cacheReadTokens: number | undefined;
        let model: string | undefined;
        let stopReason: string | undefined;
        let rawContent: ContentBlock[] | undefined;

        if (isAssistantMessage(msg.message)) {
          const usage = msg.message.usage;
          inputTokens = usage.input_tokens;
          outputTokens = usage.output_tokens;
          cacheCreationTokens = usage.cache_creation_input_tokens;
          cacheReadTokens = usage.cache_read_input_tokens;
          model = msg.message.model;
          stopReason = msg.message.stop_reason || undefined;
          rawContent = msg.message.content as ContentBlock[];
        } else if (typeof msg.message.content !== 'string') {
          rawContent = msg.message.content as ContentBlock[];
        }

        // Insert message
        const [dbMessage] = await this.db
          .insert(schema.messages)
          .values({
            conversationId: dbConversation.id,
            messageUuid: msg.uuid,
            parentUuid: msg.parentUuid,
            requestId: msg.requestId,
            role: msg.type,
            type: msg.type,
            content: messageContent,
            rawContent: rawContent as unknown as Record<string, unknown> | null,
            model,
            inputTokens,
            outputTokens,
            cacheCreationTokens,
            cacheReadTokens,
            stopReason,
            cwd: msg.cwd,
            sessionId: msg.sessionId,
            version: msg.version,
            gitBranch: msg.gitBranch,
            agentId: msg.agentId,
            userType: msg.userType,
            isSidechain: msg.isSidechain || false,
            timestamp: new Date(msg.timestamp),
          })
          .returning();

        // Insert content blocks if message has structured content
        if (rawContent && Array.isArray(rawContent)) {
          const contentBlockValues = rawContent.map((block, idx) => {
            const baseBlock = {
              messageId: dbMessage.id,
              type: block.type,
              sequence: idx,
            };

            switch (block.type) {
              case 'text':
                return {
                  ...baseBlock,
                  text: (block as TextBlock).text,
                };
              case 'thinking':
                return {
                  ...baseBlock,
                  thinking: (block as ThinkingBlock).thinking,
                };
              case 'tool_use':
                const toolUse = block as ToolUseBlock;
                return {
                  ...baseBlock,
                  toolUseId: toolUse.id,
                  toolName: toolUse.name,
                  toolInput: toolUse.input as unknown as Record<string, unknown>,
                };
              case 'tool_result':
                const toolResult = block as ToolResultBlock;
                return {
                  ...baseBlock,
                  toolResultId: toolResult.tool_use_id,
                  toolContent: toolResult.content,
                  isError: toolResult.is_error || false,
                };
              default:
                return baseBlock;
            }
          });

          if (contentBlockValues.length > 0) {
            await this.db.insert(schema.contentBlocks).values(contentBlockValues);
          }
        }
      }

      // Update processed files tracker
      await this.db
        .insert(schema.processedFiles)
        .values({
          filePath,
          lastModified: fileModTime,
          lineCount: lines.length,
        })
        .onConflictDoUpdate({
          target: schema.processedFiles.filePath,
          set: {
            lastModified: fileModTime,
            lineCount: lines.length,
            processedAt: new Date(),
          },
        });

      log.info(`      ✓ Processed: ${path.basename(filePath)} (${messages.length} messages)`);
      this.emitProgress({
        type: 'conversation',
        message: `Processed: ${path.basename(filePath)} (${messages.length} messages)`,
        data: { fileName: path.basename(filePath), messageCount: messages.length },
      });
    } catch (error) {
      log.error(`      ✗ Failed to process ${filePath}:`, error);
      this.emitProgress({
        type: 'error',
        message: `Failed to process ${path.basename(filePath)}`,
        data: { fileName: path.basename(filePath), error: String(error) },
      });
    }
  }

  private generateTitle(messages: ConversationMessage[]): string {
    if (!messages || messages.length === 0) {
      return 'Empty Conversation';
    }

    const firstUserMessage = messages.find(m => m.type === 'user');
    if (!firstUserMessage) {
      return 'Conversation';
    }

    const content = extractTextFromContent(firstUserMessage.message.content);
    const title = content.substring(0, 200);
    return title.length < content.length ? `${title}...` : title;
  }
}
