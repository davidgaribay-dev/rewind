# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rewind Viewer is a web application for browsing and visualizing Claude Code conversation history. It's a **pnpm monorepo** with three packages that work together:

- **@rewind/api** - Hono API server with PostgreSQL + Drizzle ORM
- **@rewind/web** - React SPA built with React Router v7 + TanStack Query
- **@rewind/shared** - Shared TypeScript types used by both API and Web packages

The application reads Claude Code conversation data from the local filesystem, processes it through an ETL pipeline into PostgreSQL, and serves it via a REST API to the React frontend.

## Essential Scripts Quick Reference

### Building
```bash
pnpm build          # Build all packages (API + Web)
pnpm build:api      # Build API package only
pnpm build:web      # Build Web package only
```

### Type Checking
```bash
pnpm typecheck      # Run TypeScript type checking on Web package
pnpm typecheck:web  # Run TypeScript type checking on Web package (alias)
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

### Running the Application
```bash
# Start both API (port 3000) and Web (port 5173) in parallel
pnpm dev

# Or start individually
pnpm dev:api  # API server only
pnpm dev:web  # Web app only
```

### ETL Process
```bash
# One-time import of Rewind data
pnpm etl:run

# Watch for file changes and auto-import (recommended during development)
pnpm etl:watch
```

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
1. **Source Data**: Claude Code stores conversation history as JSON files in project directories under `~/Library/Application Support/Rewind`
2. **ETL Layer**: The ETL service (`packages/api/src/etl/service.ts`) scans directories, parses JSON files, and loads data into PostgreSQL
3. **Database**: PostgreSQL (port 54321) stores normalized data with four main tables: `projects`, `conversations`, `messages`, `processed_files`
4. **API Layer**: Hono server (`packages/api/src/index.ts`) exposes REST endpoints at port 3000
5. **Frontend**: React SPA fetches data via TanStack Query and displays conversations in a browsable UI

### Database Schema

The schema is defined in `packages/api/src/db/schema.ts`:

- **projects**: Represents project directories (one-to-many with conversations)
- **conversations**: Individual conversation sessions (one-to-many with messages)
- **messages**: Individual user/assistant messages with content and timestamps
- **processed_files**: Tracks which JSON files have been processed and when (for incremental updates)

Key relationships:
- Projects → Conversations (cascade delete)
- Conversations → Messages (cascade delete)

The ETL process uses `conversationId` (from original Rewind data) as a natural key to upsert conversations without duplicates.

### API Endpoints

Located in `packages/api/src/routes/`:

- **Projects** (`routes/projects.ts`):
  - `GET /api/projects` - List all projects with conversation counts
  - `GET /api/projects/:id` - Get single project details
  - `GET /api/projects/:id/conversations` - Get all conversations for a project

- **Conversations** (`routes/conversations.ts`):
  - `GET /api/conversations/:id` - Get conversation with all messages
  - `GET /api/conversations/search?q=query&projectId=id` - Search conversations by content

### Frontend Architecture

Located in `packages/web/app/`:

- **Routing**: File-based routing via React Router v7 (SPA mode)
  - [routes/home.tsx](packages/web/app/routes/home.tsx) - Landing page
  - [routes/projects.tsx](packages/web/app/routes/projects.tsx) - Projects list
  - [routes/project.$projectId.tsx](packages/web/app/routes/project.$projectId.tsx) - Single project view
  - [routes/project.$projectId.conversation.$conversationId.tsx](packages/web/app/routes/project.$projectId.conversation.$conversationId.tsx) - Conversation viewer

- **Data Fetching**: TanStack Query configured in [lib/queryClient.tsx](packages/web/app/lib/queryClient.tsx)
  - 5 minute stale time
  - 10 minute garbage collection
  - No auto-refetch on window focus/reconnect

- **UI Components**: Radix UI primitives + custom components
  - Base UI components in [components/ui/](packages/web/app/components/ui/)
  - Application components like `ConversationViewer`, `MessageCard`, `ChatMessage` handle data display
  - `ThinkingBlock`, `ToolUseBlock`, `ToolResultBlock` render Claude's internal reasoning and tool usage

- **Styling**: Tailwind CSS v4 with custom theme and dark mode support

## ETL Incremental Updates

The ETL service implements intelligent incremental processing:

1. On first run, all JSON files are processed
2. File modification times are tracked in `processed_files` table
3. On subsequent runs, only modified files are re-processed
4. When a conversation file is updated, its messages are deleted and re-inserted (full replacement strategy)

This means `pnpm etl:watch` efficiently monitors the Rewind directory and updates the database only when files change.

## Environment Variables

Required in `.env` (see `.env.example`):

- **REWIND_DATA_PATH**: Path to Claude Code data directory (e.g., `/Users/username/Library/Application Support/Rewind`)
- **DATABASE_URL**: PostgreSQL connection string (default: `postgresql://rewind:rewind_dev_password@localhost:54321/rewind`)
- **API_PORT**: API server port (default: 3000)
- **WEB_URL**: Frontend URL for CORS (default: http://localhost:5173)
- **LOG_LEVEL**: Logging verbosity (options: `error`, `warn`, `info`, `verbose`, `debug`; default: `info`)
- **NODE_ENV**: Environment mode (`development` or `production`; affects logging behavior)

## Technology Stack

### API (@rewind/api)
- **Hono**: Ultra-fast web framework with Node.js server adapter
- **Drizzle ORM**: Type-safe SQL query builder with PostgreSQL driver
- **Chokidar**: File system watcher for ETL
- **Winston**: Structured logging with file and console transports (see [LOGGING.md](LOGGING.md))
- **tsx**: TypeScript execution for development

### Web (@rewind/web)
- **React Router v7**: File-based routing in SPA mode
- **TanStack Query**: Server state management and caching
- **TanStack Table**: Data table components with sorting/filtering
- **Radix UI**: Unstyled, accessible component primitives
- **Tailwind CSS v4**: Utility-first styling with Vite plugin
- **React Markdown**: Markdown rendering with syntax highlighting (rehype-highlight)
- **Recharts**: Data visualization charts
- **date-fns**: Date formatting utilities

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

### Debugging ETL Issues
1. Check `REWIND_DATA_PATH` points to correct directory
2. Verify JSON files exist in project subdirectories
3. Run `pnpm etl:run` with console output to see processing logs
4. Use `pnpm db:studio` to inspect database tables directly
5. Check `processed_files` table to see which files were processed and when
6. Set `LOG_LEVEL=debug` in `.env` for detailed logging output

## Logging

The project uses Winston for structured logging. See [LOGGING.md](LOGGING.md) for detailed documentation on:
- Using the logger in backend and frontend code
- Configuring log levels via environment variables
- Production logging with file transports
- Testing and troubleshooting logging
