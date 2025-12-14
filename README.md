# Rewind Viewer

A modern web application for browsing and visualizing your Claude Code (Rewind) conversation history.

## Architecture

This is a **pnpm monorepo** with two packages:

- **@rewind/api** - Hono API server with PostgreSQL + Drizzle ORM
- **@rewind/web** - React SPA with React Router v7 + TanStack Query

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

**Root commands:**
- `pnpm dev` - Start both API and web in parallel
- `pnpm build` - Build both packages
- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:push` - Push schema changes to database
- `pnpm db:studio` - Open Drizzle Studio (database GUI)
- `pnpm etl:run` - Run ETL process once
- `pnpm etl:watch` - Watch for file changes and auto-run ETL

**Package-specific:**
- `pnpm --filter @rewind/api <command>`
- `pnpm --filter @rewind/web <command>`

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
│   └── web/                  # React web app
│       ├── app/
│       │   ├── components/  # UI components
│       │   ├── hooks/       # React hooks
│       │   ├── lib/         # Utilities & API client
│       │   └── routes/      # React Router routes
│       ├── react-router.config.ts
│       └── package.json
│
├── docker-compose.yml
├── pnpm-workspace.yaml
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

### API
- [Hono](https://hono.dev/) - Ultra-fast web framework
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Chokidar](https://github.com/paulmillr/chokidar) - File watching

### Web
- [React Router v7](https://reactrouter.com/) - File-based routing (SPA mode)
- [TanStack Query](https://tanstack.com/query) - Data fetching & caching
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Radix UI](https://www.radix-ui.com/) - Headless components
- [Recharts](https://recharts.org/) - Data visualization

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

**Web app can't connect to API:**
- Verify API is running on port 3000
- Check `VITE_API_URL` in `packages/web/.env`
- Check browser console for CORS errors

## License

MIT
