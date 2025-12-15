# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rewind Viewer is a web application for browsing and visualizing Claude Code conversation history. It's a **pnpm monorepo** with four packages that work together:

- **@rewind/api** - Hono API server with PostgreSQL + Drizzle ORM
- **@rewind/web** - React SPA built with React Router v7 + TanStack Query
- **@rewind/cli** - CLI tool for automatic data synchronization with daemon mode
- **@rewind/shared** - Shared TypeScript types used by all packages

The application reads Claude Code conversation data from the local filesystem, processes it through an ETL pipeline into PostgreSQL, and serves it via a REST API to the React frontend. The CLI tool provides automatic background synchronization with file watching or polling modes.

## Essential Scripts Quick Reference

### Building
```bash
pnpm build          # Build all packages (API + Web + CLI)
pnpm build:api      # Build API package only
pnpm build:web      # Build Web package only
pnpm build:cli      # Build CLI package only
```

### Type Checking
```bash
pnpm typecheck      # Run TypeScript type checking on Web package
pnpm typecheck:web  # Run TypeScript type checking on Web package (alias)
pnpm typecheck:cli  # Run TypeScript type checking on CLI package
```
Note: The API package uses `tsc` during build. For manual typecheck, run `pnpm --filter @rewind/api build` or `cd packages/api && tsc --noEmit`.

### Database Schema Operations
```bash
pnpm db:generate    # Generate Drizzle migration files from schema changes
pnpm db:push        # Push schema changes directly to database (no migration files)
pnpm db:studio      # Open Drizzle Studio GUI at http://localhost:4983
```

**Migration Workflow**:
1. Edit schema in `packages/api/src/db/schema.ts`
2. Development: `pnpm db:push` (applies changes immediately)
3. Production: `pnpm db:generate` → creates migration files → apply manually

### Production Start
```bash
pnpm start:api      # Start production API server (requires prior build)
pnpm start:web      # Serve production Web build
```

## Development Commands

### Environment Setup

#### Option 1: Local Development (Recommended)
```bash
# Copy environment template and configure REWIND_DATA_PATH
cp .env.example .env

# Install dependencies
pnpm install

# Start PostgreSQL via Docker
docker-compose up -d

# Push database schema to PostgreSQL
pnpm db:push
```

#### Option 2: Docker Development (Full containerized setup with hot reload)
```bash
# Copy environment template and configure REWIND_DATA_PATH
cp .env.example .env

# Start all services (Postgres + API + Web) with hot reload
pnpm docker:dev

# Or rebuild and start (when dependencies change)
pnpm docker:dev:build

# Stop all services
pnpm docker:dev:down

# Stop and remove volumes (clean slate)
pnpm docker:dev:clean

# View logs
pnpm docker:dev:logs

# Rebuild when Dockerfile/config changes
pnpm docker:dev:rebuild

# Rebuild specific service
pnpm docker:dev:rebuild:api
pnpm docker:dev:rebuild:web

# View service-specific logs
pnpm docker:dev:logs:api
pnpm docker:dev:logs:web
```

**Development Docker Features:**
- **Hot reload**: Source code changes are reflected immediately without rebuilding
- **Volume mounts**: `packages/api/src`, `packages/web/app`, and `packages/shared/src` are mounted as read-only volumes
- **Node modules isolation**: Uses named volumes for `node_modules` to avoid host conflicts
- **Auto migrations**: API container automatically runs `pnpm db:push` on startup (non-interactive mode via `strict: false` in drizzle.config.ts)
- **Separate networks**: Uses `rewind-network-dev` to avoid conflicts with production setup
- **No manual pnpm install needed**: Dependencies are installed during image build

**For Docker troubleshooting:**
- Common issues: interactive prompts, port configuration, path resolution
- When to rebuild: use `pnpm docker:dev:rebuild` when Dockerfile or dependencies change
- When to restart: use `pnpm docker:dev:restart` for configuration changes
- View logs: `pnpm docker:dev:logs` or `pnpm docker:dev:logs:api` / `pnpm docker:dev:logs:web`
- Clean slate: `pnpm docker:dev:clean` removes volumes and containers

### Running the Application

#### Local Development
```bash
# Start both API (port 8429) and Web (port 8430) in parallel
pnpm dev

# Or start individually
pnpm dev:api  # API server only
pnpm dev:web  # Web app only
```

#### Docker Development
```bash
# Start all services with hot reload
pnpm docker:dev

# View logs (follow mode)
pnpm docker:dev:logs

# Or use docker-compose directly for specific operations
docker-compose -f docker-compose.dev.yml restart api
docker-compose -f docker-compose.dev.yml restart web
```

### ETL Process

#### Option 1: Manual ETL (Traditional)
```bash
# One-time import of Rewind data
pnpm etl:run

# Watch for file changes and auto-import (recommended during development)
pnpm etl:watch
```

#### Option 2: CLI Daemon (Recommended for Production)
```bash
# Install CLI globally
pnpm cli:install

# Configure CLI (interactive wizard)
rewind config

# Start daemon (runs in background)
rewind start

# Check status
rewind status

# Manual sync
rewind sync

# Stop daemon
rewind stop

# Uninstall CLI
pnpm cli:uninstall
```

**Note**: The CLI daemon and manual ETL processes coordinate via a lock mechanism to prevent conflicts. You can use either approach or both safely.

### Database Management
```bash
# Generate Drizzle migrations (after schema changes)
pnpm db:generate

# Push schema changes to database
pnpm db:push

# Open Drizzle Studio GUI at http://localhost:4983
pnpm db:studio
```

### Building
```bash
# Build both packages
pnpm build
```

### Package-Specific Commands
```bash
# Run commands in specific packages
pnpm --filter @rewind/api <command>
pnpm --filter @rewind/web <command>

# Examples
pnpm --filter @rewind/web typecheck
pnpm --filter @rewind/api build
```

## Architecture

### Data Flow
1. **Source Data**: Claude Code stores conversation history as JSONL files in project directories (configurable via Settings UI or `REWIND_DATA_PATH` env var)
2. **ETL Layer**: The ETL service ([packages/api/src/etl/service.ts](packages/api/src/etl/service.ts)) scans directories, parses JSONL files, and loads data into PostgreSQL with real-time progress streaming via Server-Sent Events
3. **Database**: PostgreSQL (port 54329) stores normalized data with five main tables: `projects`, `conversations`, `messages`, `contentBlocks`, `processedFiles`, `settings`
4. **API Layer**: Hono server ([packages/api/src/index.ts](packages/api/src/index.ts)) exposes REST endpoints at port 8429
5. **Frontend**: React SPA fetches data via TanStack Query and displays conversations in a browsable UI with Monaco code editor, statistics dashboard, and dark mode support

### Database Schema

The schema is defined in [packages/api/src/db/schema.ts](packages/api/src/db/schema.ts):

- **projects**: Represents project directories (one-to-many with conversations)
  - Fields: `id`, `name`, `path` (unique), `createdAt`, `updatedAt`, `lastScannedAt`

- **conversations**: Individual conversation sessions (one-to-many with messages)
  - Fields: `id`, `projectId`, `conversationId` (unique), `sessionId`, `title`, `model`, `totalTokens`, `inputTokens`, `outputTokens`, `createdAt`, `updatedAt`, `metadata`

- **messages**: Individual user/assistant messages with content and timestamps
  - Fields: `id`, `conversationId`, `messageUuid`, `parentUuid`, `requestId`, `role`, `type`, `content`, `rawContent`, `model`, `inputTokens`, `outputTokens`, `cacheCreationTokens`, `cacheReadTokens`, `stopReason`, `cwd`, `sessionId`, `version`, `gitBranch`, `agentId`, `userType`, `isSidechain`, `timestamp`, `metadata`

- **contentBlocks**: Stores parsed content blocks from messages (thinking, tool use, tool results)
  - Fields: `id`, `messageId`, `type`, `sequence`, `text`, `thinking`, `toolUseId`, `toolName`, `toolInput`, `toolResultId`, `toolContent`, `isError`, `metadata`
  - Types: `'text'`, `'tool_use'`, `'tool_result'`, `'thinking'`

- **processedFiles**: Tracks which JSON files have been processed and when (for incremental updates)
  - Fields: `id`, `filePath` (unique), `lastModified`, `lineCount`, `processedAt`

- **settings**: Stores application configuration (e.g., data path)
  - Fields: `id`, `key` (unique), `value`, `createdAt`, `updatedAt`

Key relationships:
- Projects → Conversations (cascade delete)
- Conversations → Messages (cascade delete)
- Messages → ContentBlocks (cascade delete)

The ETL process uses `conversationId` (from original Rewind data) as a natural key to upsert conversations without duplicates.

### API Endpoints

Located in `packages/api/src/routes/`:

- **Projects** ([routes/projects.ts](packages/api/src/routes/projects.ts)):
  - `GET /api/projects` - List all projects with stats (conversation count, message count, last activity)
  - `GET /api/projects/:id` - Get single project details
  - `GET /api/projects/:id/conversations` - Get all conversations for a project

- **Conversations** ([routes/conversations.ts](packages/api/src/routes/conversations.ts)):
  - `GET /api/conversations/:id` - Get conversation with all messages and content blocks
  - `GET /api/conversations/search?q=query&projectId=id` - Search conversations by content or title (max 500 chars, max 50 results)

- **ETL** ([routes/etl.ts](packages/api/src/routes/etl.ts)):
  - `POST /api/etl/run` - Trigger ETL import (runs in background)
  - `GET /api/etl/status` - Get current ETL status
  - `GET /api/etl/stream` - Stream ETL progress via Server-Sent Events (SSE)

- **Settings** ([routes/settings.ts](packages/api/src/routes/settings.ts)):
  - `GET /api/settings/data-path` - Get current data path from database or env var
  - `POST /api/settings/data-path` - Set/update data path in database
  - `GET /api/settings/browse?path=...` - Browse directories with conversation detection
  - `POST /api/settings/test-path` - Validate path and count projects/conversations

- **Health Check**:
  - `GET /api/health` - Returns `{ status: 'ok', timestamp }`

### Frontend Architecture

Located in `packages/web/app/`:

- **Routing**: File-based routing via React Router v7 (SPA mode)
  - [routes/home.tsx](packages/web/app/routes/home.tsx) - Projects landing page with grid/table view toggle and ETL import button
  - [routes/project.$projectId.tsx](packages/web/app/routes/project.$projectId.tsx) - Single project view with conversations list and statistics tab
  - [routes/project.$projectId.conversation.$conversationId.tsx](packages/web/app/routes/project.$projectId.conversation.$conversationId.tsx) - Conversation viewer with three tabs: Conversation, Raw JSON, Statistics
  - [routes/settings.tsx](packages/web/app/routes/settings.tsx) - Settings page with directory browser, path validation, and conversation detection

- **Data Fetching**: TanStack Query configured in [lib/queryClient.tsx](packages/web/app/lib/queryClient.tsx)
  - 5 minute stale time
  - 10 minute garbage collection
  - No auto-refetch on window focus/reconnect

- **UI Components**: Radix UI primitives + custom components
  - Base UI components in [components/ui/](packages/web/app/components/ui/) (40+ components)
  - Application components:
    - `ChatMessage` - Renders conversation messages with content blocks
    - `ConversationViewer` - Main conversation display
    - `MonacoCodeBlock` - Syntax-highlighted code display with copy button
    - `MonacoDiffBlock` - Diff viewer for code changes
    - `ThinkingBlock` - Extended thinking display
    - `ToolUseBlock` - Tool execution display
    - `ToolResultBlock` - Tool result display
    - `ETLLogViewer` - Real-time ETL progress viewer with SSE
    - `StatsDashboard` - Statistics visualization with Recharts
    - `ProjectCard` - Project card component
    - `WelcomeScreen` - Welcome message for new users
  - Data tables with TanStack Table:
    - `projects/data-table.tsx` - Sortable projects table
    - `conversations/data-table.tsx` - Sortable conversations table

- **Styling**: Tailwind CSS v4 with custom theme and dark mode support
  - Theme toggle in navbar with system preference detection
  - ThemeProvider manages dark/light mode state

## ETL Incremental Updates

The ETL service ([packages/api/src/etl/service.ts](packages/api/src/etl/service.ts)) implements intelligent incremental processing:

1. On first run, all JSONL files are processed
2. File modification times are tracked in `processedFiles` table
3. On subsequent runs, only modified files are re-processed
4. When a conversation file is updated, its messages and content blocks are deleted and re-inserted (full replacement strategy)
5. Real-time progress streaming via Server-Sent Events (SSE) at `/api/etl/stream`

**Progress Events Emitted**:
- `start` - ETL process beginning
- `project` - Processing a project directory
- `conversation` - Processing a conversation file
- `info` - Status updates
- `error` - Error occurred
- `complete` - ETL process finished

**Features**:
- Content block extraction (thinking, tool use, tool results)
- Token aggregation at conversation level
- Auto-generated conversation titles from first user message
- File operation timeout protection (30s default)
- Graceful error handling with line-level error reporting

This means `pnpm etl:watch` efficiently monitors the Rewind directory and updates the database only when files change. The frontend can display real-time progress via the `ETLLogViewer` component.

## Environment Variables

Required in `.env` (see [.env.example](.env.example)):

**Database Configuration:**
- **POSTGRES_USER**: PostgreSQL username (default: `rewind`)
- **POSTGRES_PASSWORD**: PostgreSQL password (default: `rewind_dev_password`)
- **POSTGRES_DB**: PostgreSQL database name (default: `rewind`)
- **DATABASE_URL**: PostgreSQL connection string (default: `postgresql://rewind:rewind_dev_password@localhost:54329/rewind`)

**API Configuration:**
- **API_PORT**: API server port (default: `3000`)
- **WEB_URL**: Frontend URL for CORS (default: `http://localhost:8430`)

**Web Configuration:**
- **VITE_API_URL**: API base URL for frontend (default: `http://localhost:8429`)

**Logging Configuration:**
- **LOG_LEVEL**: Logging verbosity (options: `error`, `warn`, `info`, `verbose`, `debug`; default: `info`)
- **NODE_ENV**: Environment mode (`development` or `production`; affects logging behavior)

**Data Path Configuration:**
- **REWIND_DATA_PATH**: Path to Claude Code projects directory (default: `~/.claude/projects`)
  - Common locations: `~/.claude/projects` (macOS/Linux), `%USERPROFILE%\.claude\projects` (Windows)
  - Note: This can also be configured via the Settings UI at `/settings`, which stores the path in the database `settings` table
  - Database setting takes precedence over environment variable

## Technology Stack

### API (@rewind/api)
- **Hono**: Ultra-fast web framework with Node.js server adapter
- **Drizzle ORM**: Type-safe SQL query builder with PostgreSQL driver
- **Chokidar**: File system watcher for ETL
- **Winston**: Structured logging with file and console transports
- **tsx**: TypeScript execution for development

### Web (@rewind/web)
- **React 19**: Latest React with concurrent features
- **React Router v7**: File-based routing in SPA mode
- **TanStack Query v5**: Server state management and caching
- **TanStack Table v8**: Data table components with sorting/filtering
- **Radix UI**: Unstyled, accessible component primitives (Dialog, Tabs, Buttons, etc.)
- **Tailwind CSS v4**: Utility-first styling with Vite plugin
- **Monaco Editor**: Full-featured code editor with syntax highlighting
- **React Markdown**: Markdown rendering with syntax highlighting (rehype-highlight)
- **Recharts**: Data visualization charts
- **date-fns**: Date formatting utilities
- **Sonner**: Toast notifications
- **Lucide React**: Icon library
- **Vite**: Build tool and dev server

### Shared (@rewind/shared)
- **TypeScript types**: Shared type definitions for API contracts and domain models
- No runtime dependencies - purely type definitions

## Common Development Workflows

### Working with Shared Types
1. Define types in `packages/shared/src/types.ts`
2. Export from `packages/shared/src/index.ts`
3. Import in API or Web packages: `import { TypeName } from '@rewind/shared'`
4. Changes automatically available in both packages (workspace protocol)

### Adding New API Endpoints
1. Define route handler in `packages/api/src/routes/`
2. Use Drizzle ORM queries via `getDb()` from `db/client.ts`
3. Register route in `packages/api/src/index.ts`
4. Use TypeScript types from `db/schema.ts` or `@rewind/shared`

### Modifying Database Schema
1. Edit `packages/api/src/db/schema.ts`
2. Run `pnpm db:push` to apply changes (development)
3. For production: `pnpm db:generate` to create migration, then apply manually

### Adding Frontend Features
1. Create route file in `packages/web/app/routes/` (auto-registered)
2. Use TanStack Query hooks for data fetching
3. Reuse or create UI components in `components/`
4. Follow existing patterns for loading states, error handling, and empty states

### Configuring Data Path
1. **Option 1 - Settings UI** (Recommended):
   - Navigate to `/settings` in the web application
   - Use the directory browser to navigate to your Rewind data directory
   - The browser shows which directories contain conversation files (`.jsonl`)
   - Click "Test Path" to validate the selection
   - Click "Save Settings" to persist the path in the database
   - Database setting takes precedence over environment variable

2. **Option 2 - Environment Variable**:
   - Set `REWIND_DATA_PATH` in `.env` file
   - This is used as a fallback if no database setting exists

### Debugging ETL Issues
1. Check data path is configured via Settings UI or `REWIND_DATA_PATH` in `.env`
2. Verify JSONL files (`.jsonl`) exist in project subdirectories
3. Run `pnpm etl:run` with console output to see processing logs
4. Use `pnpm db:studio` to inspect database tables directly
5. Check `processedFiles` table to see which files were processed and when
6. Set `LOG_LEVEL=debug` in `.env` for detailed logging output
7. Watch real-time ETL progress in the web UI using the "Import Data" button on the home page

## CLI Tool (@rewind/cli)

The CLI tool provides automatic background synchronization for Rewind data. It runs as a daemon process and can use either file watching or polling to detect changes.

### Installation

```bash
# Build and install globally
pnpm cli:install

# Or manually
cd packages/cli
pnpm install
pnpm build
npm link
```

### Quick Start

```bash
# 1. Configure (interactive wizard)
rewind config

# 2. Start daemon
rewind start

# 3. Check status
rewind status
```

### Commands

- **`rewind start`** - Start daemon in background
- **`rewind stop`** - Stop daemon
- **`rewind restart`** - Restart daemon
- **`rewind status`** - Show daemon status, sync stats, lock status, API health, configuration
- **`rewind sync`** - Trigger manual sync immediately
- **`rewind config`** - Interactive configuration wizard
- **`rewind config --get <key>`** - Get configuration value
- **`rewind config --set <key>=<value>`** - Set configuration value
- **`rewind config --reset`** - Reset to defaults
- **`rewind logs`** - View sync logs (last 50 lines)
- **`rewind logs --lines <n>`** - View last N lines
- **`rewind logs --clear`** - Clear all logs

### Configuration

Config stored in `~/.config/rewind-cli/config.json`:

- **apiUrl**: API server URL (default: `http://localhost:8429`)
- **dataPath**: Claude Code projects directory (default: `~/.claude/projects`)
- **watchMode**: Use file watching (true) or polling (false) (default: `true`)
- **interval**: Polling interval when watchMode is false (default: `5m`)
  - Options: `1m`, `5m`, `15m`, `30m`, `1h`
- **logLevel**: `error`, `warn`, `info`, `debug` (default: `info`)

### Sync Coordination

The CLI uses a lock file (`~/.config/rewind-cli/sync.lock`) to prevent conflicts:

- Lock acquisition before syncing (checks for existing locks)
- Stale lock detection (locks older than 5 minutes are removed)
- Heartbeat updates (active locks updated every minute)
- Graceful lock release after sync or on error

This ensures CLI daemon, web UI "Import Data" button, and manual `pnpm etl:run` never conflict.

### File Structure

```
packages/cli/
├── src/
│   ├── commands/          # CLI commands (start, stop, status, etc.)
│   ├── components/        # Ink UI components (StatusDisplay, ConfigWizard)
│   ├── services/          # Core services (daemon, sync, api)
│   ├── utils/             # Utilities (config, logger, lock)
│   └── index.ts           # CLI entry point
├── package.json
├── tsconfig.json
└── README.md              # Detailed CLI documentation
```

See [packages/cli/README.md](packages/cli/README.md) for comprehensive CLI documentation.

## Logging

The project uses Winston for structured logging with the following features:
- Console and file transports for development and production
- Configurable log levels via `LOG_LEVEL` environment variable (`error`, `warn`, `info`, `verbose`, `debug`)
- Structured JSON formatting in production
- Color-coded console output in development
- Log files stored in `logs/` directory (excluded from git)

## Design System & UI Preferences

### Marketing Site Design Language
The marketing website (`@rewind/marketing`) follows a refined, spacious design language prioritizing:

**Typography Scale:**
- **Hero headings**: `text-4xl md:text-5xl lg:text-6xl` (not larger)
- **Section headings**: `text-2xl md:text-3xl`
- **Card/Feature headings**: `text-lg`
- **Subheadings**: `text-base`
- **Body text**: `text-sm` or `text-base`
- **Supporting text**: `text-xs`
- **Code snippets**: `text-xs`

**Spacing & Padding:**
- **Section padding**: `py-24` (generous vertical rhythm)
- **Section title margins**: `mb-20` (ample breathing room)
- **Card padding**: `p-8` (spacious, not cramped)
- **Grid gaps**: `gap-8` to `gap-10` (elements need room to breathe)
- **Step spacing**: `space-y-10` (clear visual separation)
- **Feature icon size**: `h-12 w-12` with `h-6 w-6` SVGs (proportional, not oversized)
- **Button padding**: `px-7 py-3` or `px-8 py-3` (balanced clickable areas)

**Design Principles:**
- Smaller, more refined text creates better visual hierarchy
- Generous padding between elements improves readability
- Less overwhelming, more elegant
- Ample white space guides the eye
- Proportional icon sizing maintains balance

**When to Apply:**
- Use this design language for all marketing pages and landing pages
- Prioritize readability and visual comfort over density
- Maintain consistency across the marketing site
- Ensure mobile responsiveness with smaller base sizes
