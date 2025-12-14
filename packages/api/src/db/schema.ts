import { pgTable, text, timestamp, uuid, index, jsonb, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  path: text('path').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  lastScannedAt: timestamp('last_scanned_at'),
}, (table) => ({
  pathIdx: index('path_idx').on(table.path),
}));

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  conversationId: text('conversation_id').notNull().unique(), // Original Rewind conversation ID (first message uuid)
  sessionId: text('session_id'), // Rewind session ID
  title: text('title'),
  model: text('model'), // Most recent model used
  totalTokens: integer('total_tokens').default(0),
  inputTokens: integer('input_tokens').default(0),
  outputTokens: integer('output_tokens').default(0),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  metadata: jsonb('metadata'), // Store any additional metadata
}, (table) => ({
  projectIdIdx: index('project_id_idx').on(table.projectId),
  conversationIdIdx: index('conversation_id_idx').on(table.conversationId),
  sessionIdIdx: index('session_id_idx').on(table.sessionId),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
}));

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),

  // Rewind-specific fields
  messageUuid: text('message_uuid').notNull(), // Original Rewind message UUID
  parentUuid: text('parent_uuid'), // For message threading
  requestId: text('request_id'),

  // Message content
  role: text('role').notNull(), // 'user', 'assistant', or 'queue-operation'
  type: text('type').notNull(), // user/assistant/queue-operation
  content: text('content').notNull(), // Simplified text content
  rawContent: jsonb('raw_content'), // Full content blocks array

  // Model and usage
  model: text('model'), // Model used for this message (assistant only)
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  cacheCreationTokens: integer('cache_creation_tokens'),
  cacheReadTokens: integer('cache_read_tokens'),

  // Metadata
  stopReason: text('stop_reason'),
  cwd: text('cwd'),
  sessionId: text('session_id'),
  version: text('version'),
  gitBranch: text('git_branch'),
  agentId: text('agent_id'),
  userType: text('user_type'),
  isSidechain: boolean('is_sidechain').default(false),

  timestamp: timestamp('timestamp').notNull(),
  metadata: jsonb('metadata'), // Additional metadata
}, (table) => ({
  conversationIdIdx: index('message_conversation_id_idx').on(table.conversationId),
  messageUuidIdx: index('message_uuid_idx').on(table.messageUuid),
  timestampIdx: index('message_timestamp_idx').on(table.timestamp),
  modelIdx: index('message_model_idx').on(table.model),
}));

// Content blocks for tool use, thinking, etc.
export const contentBlocks = pgTable('content_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),

  type: text('type').notNull(), // 'text', 'tool_use', 'tool_result', 'thinking'
  sequence: integer('sequence').notNull(), // Order within message

  // Content based on type
  text: text('text'), // For type='text' or 'thinking'
  thinking: text('thinking'), // For type='thinking'

  // Tool use fields
  toolUseId: text('tool_use_id'), // For type='tool_use'
  toolName: text('tool_name'), // For type='tool_use'
  toolInput: jsonb('tool_input'), // For type='tool_use'

  // Tool result fields
  toolResultId: text('tool_result_id'), // For type='tool_result'
  toolContent: text('tool_content'), // For type='tool_result'
  isError: boolean('is_error'), // For type='tool_result'

  metadata: jsonb('metadata'),
}, (table) => ({
  messageIdIdx: index('content_block_message_id_idx').on(table.messageId),
  typeIdx: index('content_block_type_idx').on(table.type),
  toolNameIdx: index('content_block_tool_name_idx').on(table.toolName),
}));

// Table to track which files have been processed
export const processedFiles = pgTable('processed_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  filePath: text('file_path').notNull().unique(),
  lastModified: timestamp('last_modified').notNull(),
  lineCount: integer('line_count'), // Number of lines (messages) in file
  processedAt: timestamp('processed_at').notNull().defaultNow(),
}, (table) => ({
  filePathIdx: index('file_path_idx').on(table.filePath),
}));

// Types for TypeScript inference
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type ContentBlock = typeof contentBlocks.$inferSelect;
export type NewContentBlock = typeof contentBlocks.$inferInsert;

export type ProcessedFile = typeof processedFiles.$inferSelect;
export type NewProcessedFile = typeof processedFiles.$inferInsert;

// Relations for Drizzle query API
export const projectsRelations = relations(projects, ({ many }) => ({
  conversations: many(conversations),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  project: one(projects, {
    fields: [conversations.projectId],
    references: [projects.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  contentBlocks: many(contentBlocks),
}));

export const contentBlocksRelations = relations(contentBlocks, ({ one }) => ({
  message: one(messages, {
    fields: [contentBlocks.messageId],
    references: [messages.id],
  }),
}));

// Settings table for storing configuration
export const settings = pgTable('settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
