# Rewind Viewer

A modern web application for browsing and visualizing your Claude Code (Rewind) conversation history.

## Architecture

This is a **pnpm monorepo** with three packages:

- **@rewind/api** - Hono API server with PostgreSQL + Drizzle ORM
- **@rewind/web** - React SPA built with React Router v7 + TanStack Query
- **@rewind/shared** - Shared TypeScript types used by both API and Web packages

```
┌─────────────┐
│ Rewind Files│
└──────┬──────┘
       │
       ▼
  ┌─────────┐
  │   ETL   │  (watches files, transforms to PostgreSQL)
  └────┬────┘
       │
       ▼
┌──────────────┐
│ PostgreSQL   │
│ (port 54321) │
└──────┬───────┘
       │
       ▼
  ┌─────────┐
  │ Hono API│  (port 3000)
  └────┬────┘
       │
       ▼
┌─────────────┐
│  React Web  │  (port 5173)
└─────────────┘
```

## Setup

### 1. Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Docker & Docker Compose

### 2. Environment Configuration

Copy the example environment file and update it:

```bash
cp .env.example .env
```

Update `REWIND_DATA_PATH` to point to your Rewind data directory:

```bash
# Example for macOS
REWIND_DATA_PATH=/Users/yourusername/Library/Application Support/Rewind
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Start PostgreSQL

```bash
docker-compose up -d
```

### 5. Set up Database

```bash
# Generate and push schema
pnpm db:push
```

### 6. Run ETL Process

Import your Rewind data into PostgreSQL:

```bash
# One-time import
pnpm etl:run

# Or watch for changes (recommended)
pnpm etl:watch
```

### 7. Start Development Servers

```bash
# Start both API and Web in parallel
pnpm dev

# Or start individually
pnpm dev:api  # API on port 3000
pnpm dev:web  # Web on port 5173
```

## Development

### Available Scripts

**Development:**
- `pnpm dev` - Start both API and web in parallel
- `pnpm dev:api` - Start API server only (port 3000)
- `pnpm dev:web` - Start web app only (port 5173)

**Building:**
- `pnpm build` - Build all packages (API + Web)
- `pnpm build:api` - Build API package only
- `pnpm build:web` - Build Web package only

**Type Checking:**
- `pnpm typecheck` - Run TypeScript type checking on Web package
- `pnpm typecheck:web` - Run TypeScript type checking on Web package (alias)

**Database:**
- `pnpm db:generate` - Generate Drizzle migration files from schema changes
- `pnpm db:push` - Push schema changes directly to database (no migration files)
- `pnpm db:studio` - Open Drizzle Studio GUI at http://localhost:4983

**ETL:**
- `pnpm etl:run` - Run ETL process once
- `pnpm etl:watch` - Watch for file changes and auto-run ETL

**Production:**
- `pnpm start:api` - Start production API server (requires prior build)
- `pnpm start:web` - Serve production Web build

**Package-specific:**
- `pnpm --filter @rewind/api <command>`
- `pnpm --filter @rewind/web <command>`
- `pnpm --filter @rewind/shared <command>`

### Database Management

View and manage your data:

```bash
pnpm db:studio
```

This opens Drizzle Studio at [http://localhost:4983](http://localhost:4983)

### ETL Process

The ETL (Extract, Transform, Load) process:
1. Scans your Rewind data directory
2. Reads conversation JSON files
3. Transforms and normalizes data
4. Upserts to PostgreSQL
5. Tracks processed files to avoid re-processing unchanged data

Run with file watching for automatic updates:

```bash
pnpm etl:watch
```

## Project Structure

```
rewind/
├── packages/
│   ├── api/                  # Hono API server
│   │   ├── src/
│   │   │   ├── db/          # Database schema & client
│   │   │   ├── etl/         # ETL service & scripts
│   │   │   ├── routes/      # API routes
│   │   │   └── index.ts     # Server entry point
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   │
│   ├── web/                  # React web app
│   │   ├── app/
│   │   │   ├── components/  # UI components
│   │   │   ├── hooks/       # React hooks
│   │   │   ├── lib/         # Utilities & API client
│   │   │   └── routes/      # React Router routes
│   │   ├── react-router.config.ts
│   │   └── package.json
│   │
│   └── shared/               # Shared TypeScript types
│       ├── src/
│       │   ├── types.ts     # Type definitions
│       │   └── index.ts     # Exports
│       └── package.json
│
├── docker-compose.yml
├── pnpm-workspace.yaml
├── CLAUDE.md                 # Developer guidance for Claude Code
└── .env
```

## API Endpoints

**Projects:**
- `GET /api/projects` - List all projects with stats
- `GET /api/projects/:id` - Get single project
- `GET /api/projects/:id/conversations` - Get project conversations

**Conversations:**
- `GET /api/conversations/:id` - Get conversation with messages
- `GET /api/conversations/search?q=query&projectId=id` - Search conversations

## Tech Stack

### API (@rewind/api)
- [Hono](https://hono.dev/) - Ultra-fast web framework with Node.js server adapter
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe SQL query builder with PostgreSQL driver
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Chokidar](https://github.com/paulmillr/chokidar) - File system watcher for ETL
- [Winston](https://github.com/winstonjs/winston) - Structured logging with file and console transports
- [tsx](https://github.com/esbuild-kit/tsx) - TypeScript execution for development

### Web (@rewind/web)
- [React Router v7](https://reactrouter.com/) - File-based routing in SPA mode
- [TanStack Query](https://tanstack.com/query) - Server state management and caching
- [TanStack Table](https://tanstack.com/table) - Data table components with sorting/filtering
- [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first styling with Vite plugin
- [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible component primitives
- [React Markdown](https://github.com/remarkjs/react-markdown) - Markdown rendering with syntax highlighting (rehype-highlight)
- [Recharts](https://recharts.org/) - Data visualization charts
- [date-fns](https://date-fns.org/) - Date formatting utilities

### Shared (@rewind/shared)
- TypeScript types for API contracts and domain models
- No runtime dependencies - purely type definitions

## Troubleshooting

**PostgreSQL connection issues:**
```bash
# Check if PostgreSQL is running
docker ps

# Restart PostgreSQL
docker-compose restart
```

**ETL not finding files:**
- Verify `REWIND_DATA_PATH` in `.env` points to correct directory
- Check file permissions
- Ensure JSON files exist in project subdirectories
- Set `LOG_LEVEL=debug` in `.env` for detailed logging output

**Web app can't connect to API:**
- Verify API is running on port 3000
- Check `VITE_API_URL` in `packages/web/.env`
- Check browser console for CORS errors

**Debugging ETL issues:**
1. Check `REWIND_DATA_PATH` points to correct directory
2. Verify JSON files exist in project subdirectories
3. Run `pnpm etl:run` with console output to see processing logs
4. Use `pnpm db:studio` to inspect database tables directly
5. Check `processed_files` table to see which files were processed and when
6. Set `LOG_LEVEL=debug` in `.env` for detailed logging output

For more information about logging, see [LOGGING.md](LOGGING.md)

## Environment Variables

The following environment variables can be configured in `.env` (see `.env.example`):

- **REWIND_DATA_PATH**: Path to Claude Code data directory (e.g., `/Users/username/Library/Application Support/Rewind`)
- **DATABASE_URL**: PostgreSQL connection string (default: `postgresql://rewind:rewind_dev_password@localhost:54321/rewind`)
- **API_PORT**: API server port (default: 3000)
- **WEB_URL**: Frontend URL for CORS (default: http://localhost:5173)
- **LOG_LEVEL**: Logging verbosity (options: `error`, `warn`, `info`, `verbose`, `debug`; default: `info`)
- **NODE_ENV**: Environment mode (`development` or `production`; affects logging behavior)

## License

MIT
