// Export shared types from the shared package
export type {
  Usage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ToolResultBlock,
  ThinkingBlock,
  AssistantMessage,
  UserMessage,
  ConversationMessage,
  Project,
  Conversation,
  Stats,
} from '@rewind/shared';

// Legacy type for backwards compatibility (web-specific)
export interface MessageContent {
  type: string;
  text?: string;
  [key: string]: any;
}
