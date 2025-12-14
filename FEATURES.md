# FEATURES.md

Complete feature documentation for Rewind Viewer - a web application for browsing and visualizing Claude Code conversation history.

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

Rewind Viewer transforms Claude Code's conversation history into an interactive, searchable, and visually rich web application. It provides a comprehensive interface for browsing conversations, analyzing tool usage, tracking token consumption, and understanding Claude's reasoning process.

**Core Value Proposition**:
- Browse all Claude Code conversations across multiple projects
- Search and filter conversations by content
- Visualize tool executions with syntax highlighting
- Analyze token usage and conversation statistics
- View Claude's extended thinking process
- Beautiful, responsive interface with dark mode

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
- **System theme detection**: Auto-detect OS preference
- **Persistent preference**: Theme choice saved locally
- **Theme toggle**: Easy switch in navigation bar
- **Consistent styling**: All components theme-aware

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
- **5 main tables**: projects, conversations, messages, contentBlocks, processedFiles
- **Normalized design**: Efficient storage, no duplication
- **Cascade deletes**: Clean up related data automatically
- **Indexes**: Optimized for common queries
- **JSONB columns**: Flexible storage for raw content
- **Text columns**: Full-text search support

#### Relationships
- Projects → Conversations (one-to-many)
- Conversations → Messages (one-to-many)
- Messages → ContentBlocks (one-to-many)
- All with proper foreign keys and cascading deletes

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

### 3. Code Syntax Highlighting

#### Supported Languages
- **Web**: TypeScript, JavaScript, JSX, TSX, JSON, HTML, CSS
- **Backend**: Python, Rust, Go, Java, C, C++, C#, PHP, Ruby
- **Shell**: Bash, Shell script
- **Data**: SQL, YAML, TOML, Markdown
- **Auto-detection**: Analyzes content to determine language

#### Highlighting Features
- **Line numbers**: Easy reference for Read tool output
- **Theme-aware**: Works in light and dark modes
- **Copy functionality**: Copy code with button click
- **Lazy loading**: Load highlighter only when needed
- **Rehype-highlight**: Fast, reliable syntax highlighting

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
pnpm dev:api  # API only on port 3000
pnpm dev:web  # Web only on port 5173
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
- **Standard location**: `~/Library/Application Support/Rewind` (macOS)
- **Configurable path**: REWIND_DATA_PATH environment variable
- **Auto-discovery**: Scans for project directories
- **No modification**: Reads files without changing them

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
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get single project
- `GET /api/projects/:id/conversations` - Get project conversations

**Conversations**:
- `GET /api/conversations/:id` - Get full conversation
- `GET /api/conversations/search?q=query&projectId=id` - Search

#### CORS Configuration
- **Configured origins**: WEB_URL environment variable
- **Allowed methods**: GET, POST, PUT, DELETE, OPTIONS
- **Development-friendly**: Localhost allowed by default

#### Response Format
- **Consistent structure**: All responses are JSON
- **Error format**: `{ error: "message" }`
- **Success data**: Direct object or array
- **HTTP status codes**: Proper REST semantics

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

Rewind Viewer is a feature-rich, production-quality application that transforms Claude Code's conversation history into an accessible, searchable, and visually stunning interface. It combines:

- **Comprehensive data extraction**: Captures all conversation details
- **Beautiful visualization**: Rich rendering of messages, tools, and thinking
- **Powerful search**: Full-text search across all conversations
- **Detailed analytics**: Token usage, model distribution, activity trends
- **Developer-friendly**: Type-safe, well-logged, easy to extend
- **Production-ready**: Docker, migrations, error handling, performance optimization

The application serves both casual users (browsing conversations) and power users (analyzing tool usage, tracking tokens, debugging Claude interactions) with an interface that's intuitive yet powerful.
