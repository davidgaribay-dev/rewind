# FEATURES.md

Complete feature documentation for **Rewind** - a modern web application for browsing and visualizing Claude Code conversation history.

## Table of Contents

- [Overview](#overview)
- [User-Facing Features](#user-facing-features)
- [Data Management Features](#data-management-features)
- [Visualization & Analytics](#visualization--analytics)
- [Developer Features](#developer-features)
- [Technical Capabilities](#technical-capabilities)
- [UI/UX Features](#uiux-features)
- [Integration Features](#integration-features)

---

## Overview

**Rewind** transforms Claude Code's conversation history into an interactive, searchable, and visually rich web application. It provides a comprehensive interface for browsing conversations, analyzing tool usage, tracking token consumption, and understanding Claude's reasoning process.

**Core Value Proposition**:
- Browse all Claude Code conversations across multiple projects
- Search and filter conversations by content
- Visualize tool executions with Monaco code editor and syntax highlighting
- Analyze token usage and conversation statistics
- View Claude's extended thinking process
- Configure data path via intuitive Settings UI with directory browser
- Real-time ETL progress streaming via Server-Sent Events
- Beautiful, responsive interface with dark mode and theme toggle

---

## User-Facing Features

### 1. Project Management

#### Project List View
- **Grid View**: Visual card-based layout with key statistics
- **Table View**: Sortable data table with detailed information
- **Project Statistics**:
  - Total conversations count
  - Total messages count
  - Last activity timestamp
  - Project path display

#### Sorting Options
- Sort by project name (alphabetical)
- Sort by project path
- Sort by conversation count
- Sort by last modified date

#### Navigation
- Click any project to view its conversations
- Breadcrumb navigation for easy traversal
- Refresh button to reload data

### 2. Conversation Browsing

#### Conversation List
- **Data Table**: Sortable, filterable list of all conversations in a project
- **Visible Information**:
  - Conversation title (auto-generated from first user message)
  - Creation date and time
  - Message count
  - Model used (e.g., "Sonnet 3.5", "Opus 3", "Haiku 3")
  - Total token usage
- **Sorting**: By date, message count, model, or token usage
- **Click to Open**: Navigate to full conversation view

#### Conversation Viewer (3 Tabs)

**Tab 1: Conversation (Formatted)**
- Rich, formatted display of entire conversation
- User messages displayed as chat bubbles (right-aligned)
- Assistant messages with structured content blocks
- Markdown rendering with syntax highlighting
- Code blocks with copy-to-clipboard functionality
- Collapsible sections for long content
- Visual distinction between content types

**Tab 2: Raw JSON**
- Complete raw conversation data in JSON format
- For debugging and advanced inspection
- Preserves all original metadata

**Tab 3: Statistics**
- Token usage breakdown by type:
  - Input tokens
  - Output tokens
  - Cache creation tokens
  - Cache read tokens
- Message count statistics
- Model information
- Conversation metadata display

### 3. Message Display

#### User Messages
- **Compact bubble design**: Right-aligned, chat-style
- **Clean presentation**: Focus on content
- **Timestamp display**: Message creation time
- **Token breakdown**: Collapsible token usage details

#### Assistant Messages
- **Full-width structured layout**
- **Multiple content block types**:
  - Text blocks with markdown rendering
  - Extended thinking blocks (purple theme)
  - Tool use blocks (color-coded by tool)
  - Tool result blocks (success/error states)
- **Grouped tool execution**: Tool uses paired with their results
- **Visual separators**: Clear content organization
- **Copy functionality**: Copy text, code, and thinking blocks

### 4. Extended Thinking Display

Claude's internal reasoning process (when using extended thinking):

- **Collapsible blocks**: Expand/collapse thinking content
- **Preview mode**: First 120 characters shown when collapsed
- **Purple theming**: Visual distinction from regular content
- **Brain icon**: Instant recognition of thinking blocks
- **Copy button**: Copy full thinking content
- **Formatted display**: Preserves structure and readability

### 5. Tool Execution Visualization

Rich display of all Claude Code tool executions:

#### Tool Use Blocks
- **Color-coded by tool type**:
  - Bash commands: Green
  - Read operations: Blue
  - Write operations: Orange
  - Edit operations: Purple
  - Grep searches: Pink
  - Glob patterns: Cyan
  - Web operations: Indigo
  - Task operations: Violet
- **Tool information display**:
  - Tool name and category badge
  - Human-readable description
  - Primary parameter preview
  - Expandable full parameters
- **Icons**: Unique icon for each tool type
- **Collapsible parameters**: Show/hide detailed inputs

#### Tool Result Blocks
- **Success/error visual indicators**:
  - Green checkmark for success
  - Red X for errors
- **Syntax highlighting**: Automatic language detection
  - Supports: TypeScript, JavaScript, Python, Rust, Go, JSON, SQL, Bash, etc.
  - Line numbers for Read tool output
  - Formatted code display
- **Visual connector**: Line connecting tool use to result
- **Lazy loading**: Performance optimization for large results
- **Expandable content**: Collapsible for long outputs

### 6. Search & Discovery

#### Conversation Search
- **Full-text search**: Search conversation titles and message content
- **Project filtering**: Scope search to specific projects
- **Fast results**: PostgreSQL full-text indexing
- **Result preview**: Quick glance at matching conversations
- **Result limit**: Top 50 matches returned

#### Navigation
- **Breadcrumb trail**: Always know your location
- **Direct links**: Share specific conversations
- **Back/forward**: Browser history support

### 7. Theme Support

- **Dark mode**: Full dark theme with carefully chosen colors
- **Light mode**: Clean, accessible light theme
- **System theme detection**: Auto-detect OS preference on first visit
- **Persistent preference**: Theme choice saved in localStorage
- **Theme toggle**: Sun/Moon icon toggle in navigation bar
- **Consistent styling**: All components theme-aware via ThemeProvider
- **Smooth transitions**: Gradual color changes when switching themes

### 8. Settings & Configuration

#### Settings UI (`/settings` route)
- **Directory Browser**:
  - Navigate filesystem with home and parent directory buttons
  - Visual breadcrumb-style current path display
  - List of subdirectories with folder icons
  - Special indicator for directories containing conversation files (`.jsonl`)
  - Badge showing "Has conversations" for valid data directories
- **Path Validation**:
  - "Test Path" button validates selected directory
  - Displays count of projects and conversations found
  - Real-time validation feedback (success/error states)
  - Visual indicators (green checkmark / red X)
- **Path Persistence**:
  - "Save Settings" button stores path in database
  - Database setting takes precedence over environment variable
  - Loads saved path automatically on page load
- **User-Friendly Interface**:
  - Clear instructions and help text
  - Current path display with monospace font
  - Selected path preview
  - Visual feedback for all actions via toast notifications

### 9. Real-Time ETL Progress

#### ETL Log Viewer Component
- **Live Progress Streaming**: Server-Sent Events (SSE) for real-time updates
- **Event Types Displayed**:
  - Start event: ETL process beginning
  - Project events: Each project being processed
  - Conversation events: Individual conversation imports
  - Info events: Status updates and progress messages
  - Error events: Any issues encountered
  - Complete event: ETL process finished
- **Visual Indicators**:
  - Color-coded event types (info = blue, error = red, success = green)
  - Timestamp for each event
  - Auto-scrolling log viewer
  - Loading spinner during active ETL
- **Triggered From**:
  - "Import Data" button on home page
  - Command line: `pnpm etl:run` or `pnpm etl:watch`
  - POST request to `/api/etl/run`
- **User Experience**:
  - Modal dialog with live log feed
  - Close button to dismiss (ETL continues in background)
  - Completion toast notification
  - Automatic project list refresh on completion

---

## Data Management Features

### 1. ETL (Extract, Transform, Load) Pipeline

#### One-Time Import
```bash
pnpm etl:run
```
- Scans entire REWIND_DATA_PATH directory
- Processes all `.jsonl` conversation files
- Loads data into PostgreSQL database
- Displays progress and statistics

#### Watch Mode
```bash
pnpm etl:watch
```
- **File system monitoring**: Watches for changes in real-time
- **Automatic processing**: Detects new/modified conversation files
- **Debounced updates**: 2-second delay to batch rapid changes
- **Incremental processing**: Only processes changed files
- **Event handling**: Add, change, and delete events
- **Background operation**: Runs continuously during development

#### Intelligent Incremental Updates
- **File modification tracking**: Stores last-modified timestamps
- **Skip unchanged files**: Avoids re-processing
- **Full replacement strategy**: When file changes, messages are deleted and re-inserted
- **Natural key upserts**: Uses conversationId to prevent duplicates
- **Performance optimization**: Processes only what's needed

### 2. Data Extraction

#### From Claude Code Files
- **JSON Lines format**: One message per line in `.jsonl` files
- **Project directory scanning**: Finds all projects automatically
- **Robust parsing**: Handles malformed JSON gracefully
- **Timeout protection**: 10s for file stat, 30s for file read

#### Extracted Data
- **Messages**: Role, content, timestamps, UUIDs
- **Content blocks**: Text, thinking, tool_use, tool_result
- **Tool metadata**: Names, inputs, outputs, success/error states
- **Token usage**: Input, output, cache creation, cache read
- **Conversation metadata**: Model, session, version, git branch
- **Project information**: Name, path, last scanned time

### 3. Data Storage

#### PostgreSQL Schema
- **6 main tables**:
  - `projects` - Project directories and metadata
  - `conversations` - Conversation sessions with aggregate stats
  - `messages` - Individual messages with content and metadata
  - `contentBlocks` - Parsed content (text, thinking, tool_use, tool_result)
  - `processedFiles` - File modification tracking for incremental ETL
  - `settings` - Application configuration (e.g., data path)
- **Normalized design**: Efficient storage, no duplication
- **Cascade deletes**: Clean up related data automatically
- **Indexes**: Optimized for common queries
  - conversations: projectId, conversationId, sessionId, createdAt
  - messages: conversationId, messageUuid, timestamp, model
  - contentBlocks: messageId, type, toolName
  - processedFiles: filePath
- **JSONB columns**: Flexible storage for raw content and metadata
- **Text columns**: Full-text search support with ILIKE queries

#### Relationships
- Projects → Conversations (one-to-many, cascade delete)
- Conversations → Messages (one-to-many, cascade delete)
- Messages → ContentBlocks (one-to-many, cascade delete)
- Settings: Key-value store with unique constraint on key

### 4. Data Integrity

- **Unique constraints**: Prevent duplicate projects and conversations
- **UUID tracking**: Preserves original Claude Code message IDs
- **Timestamp preservation**: Original message times maintained
- **Metadata retention**: All original data available in raw format
- **Transaction safety**: Database operations use transactions
- **Error handling**: Graceful failure with logging

---

## Visualization & Analytics

### 1. Statistics Dashboard

#### Overall Project Statistics
- **Total conversations**: Count across all conversations
- **Total messages**: User + assistant messages
- **Total tokens used**: Aggregated token consumption
- **Most used model**: Frequency analysis of Claude models

#### Activity Timeline Chart
- **Line chart**: Conversations over time
- **Date grouping**: Daily or weekly aggregation
- **Interactive tooltips**: Hover for detailed information
- **Responsive design**: Adapts to screen size
- **Recharts library**: Smooth, animated charts

#### Model Distribution Chart
- **Pie chart**: Percentage breakdown by model
- **Color-coded segments**: Visual distinction
- **Interactive legend**: Click to highlight segments
- **Percentage labels**: Clear proportions
- **Model name parsing**: Human-readable names (e.g., "Sonnet 3.5" instead of "claude-3-5-sonnet-20241022")

### 2. Per-Conversation Analytics

#### Message Statistics
- **Total messages**: User and assistant count
- **Average message length**: Character count analysis
- **Token breakdown**:
  - Input tokens (prompt)
  - Output tokens (response)
  - Cache creation tokens
  - Cache read tokens
- **Model used**: Specific Claude model version
- **Conversation duration**: Time span from first to last message

#### Token Usage Visualization
- **Collapsible token cards**: Per-message token details
- **Visual indicators**: Progress bars for token ratios
- **Total aggregation**: Conversation-level totals
- **Cache efficiency**: Show cache hit rates

### 3. Monaco Code Editor Integration

#### Monaco Editor Features
- **Full-featured code editor**: Same editor as VS Code
- **Syntax highlighting**: Support for 60+ languages
- **Line numbers**: Easy reference for code blocks
- **Copy functionality**: One-click copy button
- **Diff viewer**: Side-by-side comparison for code changes (MonacoDiffBlock)
- **Theme integration**: Automatically matches light/dark mode
- **Minimap**: Visual code overview for large blocks
- **Word wrap**: Configurable text wrapping
- **Read-only mode**: Perfect for viewing conversation code

#### Supported Languages
- **Web**: TypeScript, JavaScript, JSX, TSX, JSON, HTML, CSS, SCSS
- **Backend**: Python, Rust, Go, Java, C, C++, C#, PHP, Ruby, Kotlin, Swift
- **Shell**: Bash, PowerShell, Shell script
- **Data**: SQL, YAML, TOML, XML, Markdown
- **Config**: Dockerfile, nginx, Apache, .env files
- **Auto-detection**: Intelligently determines language from content and context

#### Additional Code Highlighting
- **Rehype-highlight**: Fallback for inline code and markdown
- **Lazy loading**: Load Monaco only when code blocks are present
- **Performance optimized**: Virtualized rendering for large files

---

## Developer Features

### 1. Database Management

#### Drizzle Studio
```bash
pnpm db:studio
```
- **Web GUI**: Opens at http://localhost:4983
- **Browse tables**: View all data visually
- **Run queries**: Execute SQL directly
- **Schema inspection**: See relationships and constraints
- **Edit data**: Modify records in the UI
- **Export data**: Download as CSV/JSON

#### Schema Migrations
```bash
pnpm db:generate  # Generate migration files
pnpm db:push      # Push schema changes directly
```
- **Type-safe schema**: Drizzle TypeScript definitions
- **Migration tracking**: Version-controlled SQL files
- **Development workflow**: Push for quick iterations
- **Production workflow**: Generate for controlled deployments

### 2. Logging Infrastructure

#### Winston Structured Logging
- **5 log levels**: error, warn, info, verbose, debug
- **Environment-aware**:
  - Development: Colorized console output
  - Production: JSON file output (combined.log, error.log)
- **Contextual metadata**: Timestamps, function names, request IDs
- **File rotation**: Prevents log files from growing too large

#### Configuration
```bash
LOG_LEVEL=debug  # Set in .env file
NODE_ENV=production  # Changes logging behavior
```

#### Frontend Logging
- **Browser-compatible logger**: Console-based
- **Same API as backend**: Consistent usage
- **Structured logging**: Objects and metadata support
- **Development tool**: Debugging in browser console

### 3. Type Safety

#### End-to-End TypeScript
- **100% TypeScript**: No JavaScript files
- **Strict mode**: Maximum type checking
- **Shared types**: @rewind/shared package
- **API contract types**: Frontend knows backend shape
- **Database types**: Drizzle generates from schema

#### Type Checking
```bash
pnpm typecheck     # Check web package
pnpm build:api     # Builds and type-checks API
```

### 4. Development Workflow

#### Hot Module Replacement
```bash
pnpm dev  # Start both API and web with HMR
```
- **Instant updates**: Changes reflect immediately
- **State preservation**: React state maintained
- **API auto-restart**: Hono server reloads on changes
- **Fast iteration**: No manual rebuilds

#### Parallel Development
```bash
pnpm dev:api  # API only on port 8429
pnpm dev:web  # Web only on port 8430
```
- **Independent processes**: Work on API or frontend separately
- **CORS configured**: Seamless communication
- **Concurrent execution**: Both can run simultaneously

#### Package-Specific Commands
```bash
pnpm --filter @rewind/api <command>
pnpm --filter @rewind/web <command>
```
- **Isolated execution**: Run commands in specific packages
- **Dependency management**: pnpm workspace features
- **Clean builds**: No cross-package contamination

---

## Technical Capabilities

### 1. Performance Optimizations

#### Frontend Caching (TanStack Query)
- **5-minute stale time**: Data considered fresh for 5 minutes
- **10-minute garbage collection**: Unused data cleaned up
- **No auto-refetch**: Prevents unnecessary API calls
- **Smart invalidation**: Manual refresh when needed
- **Request deduplication**: Multiple identical requests collapsed

#### Backend Optimizations
- **Database indexing**: Fast queries on common fields
  - conversations: projectId, conversationId, sessionId, createdAt
  - messages: conversationId, messageUuid, timestamp, model
  - contentBlocks: messageId, type, toolName
- **Connection pooling**: Efficient database connections
- **Prepared statements**: Query plan caching

#### UI Performance
- **Lazy loading**: Syntax highlighter loaded on demand
- **Memoization**: Statistics calculations cached
- **Collapsible content**: Large blocks hidden by default
- **Virtual scrolling**: (Available via TanStack Table)
- **Code splitting**: React Router automatic splitting

### 2. Search Capabilities

#### Full-Text Search
- **PostgreSQL ILIKE**: Case-insensitive pattern matching
- **Multi-field search**: Searches titles and message content
- **Parameterized queries**: SQL injection protection
- **Project scoping**: Filter by specific project
- **Result limiting**: Top 50 results for performance

#### Search Optimization
- **Indexed columns**: Fast text searches
- **Extracted content**: Searchable text from all content blocks
- **Efficient queries**: Only necessary joins
- **Early termination**: Limit applied at database level

### 3. Error Handling

#### Frontend Error Handling
- **React Error Boundaries**: Catch component errors
- **TanStack Query error states**: Loading/error/success
- **User-friendly messages**: Clear error descriptions
- **Retry functionality**: Manual retry for failed requests
- **Fallback UI**: Graceful degradation

#### Backend Error Handling
- **Try-catch blocks**: All async operations protected
- **HTTP status codes**: Proper REST semantics
  - 200: Success
  - 400: Bad request (invalid UUID)
  - 404: Not found
  - 500: Server error
- **Error logging**: All errors logged with Winston
- **Validation**: Input validation before processing

### 4. Real-Time Updates

#### File System Watching (Chokidar)
- **Reliable detection**: Works across platforms (macOS, Linux, Windows)
- **Glob patterns**: Watch specific file types (`**/*.jsonl`)
- **Event types**: add, change, unlink
- **Atomic writes**: Handles editor save patterns
- **Recursive watching**: Monitors entire directory tree

#### Debouncing
- **2-second delay**: Prevents rapid re-processing
- **Batch updates**: Groups related changes
- **Event coalescing**: Multiple saves treated as one

### 5. Security

#### Input Validation
- **UUID format checking**: Regex validation for IDs
- **Parameterized queries**: SQL injection prevention
- **CORS configuration**: Restricts API access to frontend
- **Environment variable validation**: Required vars checked at startup

#### Data Safety
- **Read-only source files**: Never modifies original Claude Code data
- **Database transactions**: Atomic operations
- **Backup-friendly**: PostgreSQL standard tooling works
- **Graceful shutdown**: Clean connection closure

---

## UI/UX Features

### 1. Responsive Design

#### Layout Adaptation
- **Mobile-friendly**: Works on phones and tablets
- **Responsive grid**: Adjusts columns based on screen size
- **Flexible tables**: Horizontal scrolling on small screens
- **Touch-optimized**: Tap targets sized appropriately
- **Breakpoints**: Tailwind responsive utilities

#### Component Responsiveness
- **Collapsible sidebars**: (Extendable)
- **Adaptive navigation**: Mobile menu support
- **Flexible cards**: Stack on narrow screens
- **Resizable panels**: (Available via Radix Resizable)

### 2. Accessibility

#### Radix UI Primitives
- **Keyboard navigation**: All components keyboard-accessible
- **ARIA attributes**: Screen reader support
- **Focus management**: Proper focus order and visibility
- **Semantic HTML**: Correct element usage
- **Color contrast**: WCAG AA compliant

#### User-Friendly Features
- **Loading states**: Spinners and skeleton screens
- **Empty states**: Helpful messages when no data
- **Error messages**: Clear, actionable error text
- **Success feedback**: Visual confirmation of actions
- **Tooltips**: Hover hints for unclear UI elements

### 3. Visual Design

#### Color System
- **Tailwind CSS v4**: Modern utility-first framework
- **Custom theme**: Consistent color palette
- **Dark mode**: Carefully chosen dark colors
- **Semantic colors**: Success (green), error (red), warning (yellow)
- **Tool color coding**: Unique colors for each tool type

#### Typography
- **Font stack**: System fonts for performance
- **Hierarchy**: Clear heading levels (h1-h6)
- **Readable line height**: Optimized for long-form content
- **Monospace code**: Terminal and code blocks
- **Markdown styling**: Formatted prose rendering

#### Spacing & Layout
- **Consistent spacing**: Tailwind spacing scale
- **Card design**: Elevated surfaces with shadows
- **Grid layouts**: Organized content sections
- **Flexbox**: Flexible component arrangement
- **Padding/margins**: Visual breathing room

### 4. Interaction Design

#### User Feedback
- **Hover states**: Visual feedback on interactive elements
- **Active states**: Button press indication
- **Focus rings**: Keyboard focus visibility
- **Disabled states**: Clearly non-interactive
- **Loading indicators**: Progress awareness

#### Smooth Transitions
- **Collapsible animations**: Smooth expand/collapse
- **Page transitions**: (Available via React Router)
- **Chart animations**: Recharts smooth rendering
- **Theme transitions**: Gradual color changes

#### Copy Functionality
- **One-click copy**: Copy buttons on code and thinking blocks
- **Visual feedback**: Checkmark on successful copy
- **Clipboard API**: Modern browser clipboard access
- **Fallback**: Manual selection if clipboard unavailable

---

## Integration Features

### 1. Claude Code Integration

#### Data Source
- **Configurable via Settings UI**: Navigate to `/settings` to browse and select data path
- **Database-stored preference**: Path saved in `settings` table
- **Environment variable fallback**: REWIND_DATA_PATH as backup configuration
- **Standard location**: `~/.claude/projects` (macOS/Linux), `%USERPROFILE%\.claude\projects` (Windows)
- **Auto-discovery**: Scans for project directories
- **No modification**: Reads files without changing them
- **Path validation**: Test path to verify conversations before saving

#### Supported Data
- **All message types**: User, assistant, system
- **All content types**: Text, thinking, tool_use, tool_result
- **All tools**: Bash, Read, Write, Edit, Grep, Glob, Task, WebFetch, WebSearch
- **Metadata**: Session ID, git branch, working directory, agent ID
- **Token tracking**: All token types (input, output, cache)

#### Conversation Preservation
- **Complete history**: All messages imported
- **Chronological order**: Original message sequence
- **Threading**: Parent-child relationships (future feature)
- **Sidechain support**: Parallel conversation branches (data captured)

### 2. Docker Integration

#### PostgreSQL Container
```bash
docker-compose up -d  # Start database
docker-compose down   # Stop database
```
- **Isolated database**: No system PostgreSQL required
- **Persistent storage**: Data survives container restarts
- **Custom port**: 54321 (avoids conflicts with default PostgreSQL)
- **Pre-configured**: User, password, and database set up

#### Environment Variables
- **Database credentials**: Set in docker-compose.yml
- **Connection string**: Automatically constructed from env vars
- **Volume mapping**: Data stored in Docker volume

### 3. Git Integration

#### Metadata Tracking
- **Git branch**: Captured from Claude Code conversations
- **Working directory**: Project path at conversation time
- **Useful for**:
  - Understanding context of conversation
  - Linking conversations to specific feature branches
  - Tracking work across different git states

### 4. API Integration

#### REST API Endpoints
All endpoints return JSON:

**Projects**:
- `GET /api/projects` - List all projects with stats (conversation count, message count, last activity)
- `GET /api/projects/:id` - Get single project details
- `GET /api/projects/:id/conversations` - Get all conversations for a project

**Conversations**:
- `GET /api/conversations/:id` - Get full conversation with messages and content blocks
- `GET /api/conversations/search?q=query&projectId=id` - Search conversations by content or title (max 500 chars, max 50 results)

**ETL (Extract, Transform, Load)**:
- `POST /api/etl/run` - Trigger ETL import (runs in background)
- `GET /api/etl/status` - Get current ETL status
- `GET /api/etl/stream` - Stream ETL progress via Server-Sent Events (SSE)

**Settings**:
- `GET /api/settings/data-path` - Get current data path from database or env var
- `POST /api/settings/data-path` - Set/update data path in database
- `GET /api/settings/browse?path=...` - Browse directories with conversation detection
- `POST /api/settings/test-path` - Validate path and count projects/conversations

**Health Check**:
- `GET /api/health` - Returns `{ status: 'ok', timestamp }`

#### Server-Sent Events (SSE)
- **ETL Progress Streaming**: `/api/etl/stream` endpoint
- **Real-time updates**: Events pushed as they occur
- **Event types**: start, project, conversation, info, error, complete
- **Automatic reconnection**: Browser handles connection drops
- **Efficient**: One-way server-to-client communication

#### CORS Configuration
- **Configured origins**: WEB_URL environment variable (default: http://localhost:8430)
- **Allowed methods**: GET, POST, PUT, DELETE, OPTIONS
- **Development-friendly**: Localhost allowed by default
- **Credentials support**: Cookies and auth headers allowed

#### Response Format
- **Consistent structure**: All responses are JSON
- **Error format**: `{ error: "message" }` with appropriate HTTP status codes
- **Success data**: Direct object or array
- **HTTP status codes**: Proper REST semantics
  - 200: Success
  - 400: Bad request (validation errors)
  - 404: Not found
  - 500: Server error

---

## Future Feature Potential

Based on the architecture, these features could be easily added:

### Near-Term Enhancements
- **Message threading**: Display parent-child message relationships
- **Sidechain visualization**: Show parallel conversation branches
- **Advanced search**: Regex, date ranges, model filtering
- **Export functionality**: Export conversations as Markdown/PDF
- **Conversation comparison**: Side-by-side diff view
- **Tag system**: User-defined tags for conversations

### Medium-Term Enhancements
- **User authentication**: Multi-user support
- **Favorites/bookmarks**: Save important conversations
- **Annotations**: Add notes to conversations
- **Sharing**: Generate shareable links
- **Code extraction**: Extract all code blocks from conversation
- **Tool usage analytics**: Which tools are used most

### Advanced Features
- **AI analysis**: Summarize conversations with Claude API
- **Pattern detection**: Find similar conversations
- **Time tracking**: How long between messages
- **Conversation branching**: Create alternate conversation paths
- **Collaborative features**: Share and discuss conversations
- **Webhook integration**: Notify external systems of new conversations

---

## Summary

**Rewind** is a feature-rich, production-quality application that transforms Claude Code's conversation history into an accessible, searchable, and visually stunning interface. It combines:

- **Comprehensive data extraction**: Captures all conversation details with intelligent ETL pipeline
- **Beautiful visualization**: Rich rendering with Monaco code editor, syntax highlighting, and Monaco diff viewer
- **Real-time ETL progress**: Server-Sent Events for live import updates
- **Intuitive configuration**: Settings UI with directory browser and path validation
- **Powerful search**: Full-text search across all conversations and content
- **Detailed analytics**: Token usage, model distribution, activity trends with Recharts visualizations
- **Modern UI/UX**: Dark mode, theme toggle, responsive design, toast notifications
- **Developer-friendly**: 100% TypeScript, type-safe, well-logged, easy to extend
- **Production-ready**: Docker, PostgreSQL, migrations, error handling, performance optimization

The application serves both casual users (browsing conversations) and power users (analyzing tool usage, tracking tokens, debugging Claude interactions, viewing extended thinking) with an interface that's intuitive yet powerful.

**Key Differentiators**:
- Monaco Editor integration (same as VS Code)
- Real-time ETL progress streaming via SSE
- Settings UI for easy data path configuration
- Content blocks separation (text, thinking, tool use, tool results)
- Database-stored configuration preferences
- Comprehensive token usage tracking including cache tokens
- Extended thinking visualization
- Dark mode with system preference detection
