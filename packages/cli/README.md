# @rewind/cli

CLI tool for automatic Rewind data synchronization.

## Features

- **Automatic Sync**: Daemon runs in background and syncs your Claude Code conversations automatically
- **File Watching**: Real-time sync when conversation files change (default)
- **Polling Mode**: Alternative polling mode with configurable intervals
- **Sync Coordination**: Prevents conflicts between CLI and web UI syncing
- **Interactive Configuration**: Easy setup with Ink-powered interactive wizard
- **Status Monitoring**: Real-time status display with daemon, sync, and API health
- **Logging**: Comprehensive logging with rotation and multiple log levels

## Installation

### Global Installation (Recommended)

```bash
# From the monorepo root
pnpm build
pnpm add -g ./packages/cli

# Or install directly
cd packages/cli
pnpm install
pnpm build
npm link
```

### Local Development

```bash
cd packages/cli
pnpm install
pnpm dev <command>
```

## Quick Start

1. **Configure the CLI** (interactive wizard):

```bash
rewind config
```

This will guide you through:
- API URL (default: `http://localhost:8429`)
- Data path (where Claude Code stores conversations)
- Sync mode (file watching or polling)
- Log level

2. **Start the daemon**:

```bash
rewind start
```

3. **Check status**:

```bash
rewind status
```

The daemon will now automatically sync your conversations in the background!

## Commands

### `rewind start`

Start the sync daemon in background.

```bash
rewind start
```

### `rewind stop`

Stop the sync daemon.

```bash
rewind stop
```

### `rewind restart`

Restart the sync daemon.

```bash
rewind restart
```

### `rewind status`

Display comprehensive status information:
- Daemon status (running, PID, uptime)
- Sync statistics (last sync, total syncs, failed syncs)
- Sync lock status
- API server health
- Current configuration

```bash
rewind status
```

### `rewind sync`

Trigger a manual sync immediately. Useful for testing or when you want to sync right now.

```bash
rewind sync
```

### `rewind config`

Interactive configuration wizard or get/set individual values.

```bash
# Interactive wizard
rewind config

# Get a value
rewind config --get apiUrl

# Set a value
rewind config --set apiUrl=http://localhost:8429

# Reset to defaults
rewind config --reset
```

### `rewind logs`

View sync logs.

```bash
# View last 50 lines (default)
rewind logs

# View last 100 lines
rewind logs --lines 100

# Clear all logs
rewind logs --clear
```

## Configuration

Configuration is stored in `~/.config/rewind-cli/config.json` (or platform-specific config directory).

### Options

- **apiUrl**: API server URL (default: `http://localhost:8429`)
- **dataPath**: Claude Code projects directory (default: `~/.claude/projects`)
- **watchMode**: Use file watching (true) or polling (false) (default: `true`)
- **interval**: Polling interval when watchMode is false (e.g., `5m`, `1h`) (default: `5m`)
- **logLevel**: Logging verbosity: `error`, `warn`, `info`, `debug` (default: `info`)
- **autoStart**: Auto-start daemon on system boot (future feature)

## How It Works

### Sync Coordination

The CLI uses a lock file (`~/.config/rewind-cli/sync.lock`) to prevent conflicts:

1. **Lock Acquisition**: Before syncing, the CLI checks if a lock exists
2. **Stale Lock Detection**: Locks older than 5 minutes are considered stale and removed
3. **Heartbeat**: Active locks are updated every minute to indicate activity
4. **Lock Release**: Lock is released after sync completes or on error

This ensures the CLI daemon and web UI never sync simultaneously.

### File Watching Mode (Default)

- Uses [chokidar](https://github.com/paulmillr/chokidar) to watch `**/*.jsonl` files
- Debounces changes (waits 3 seconds after last change)
- Automatically triggers sync when files are added, changed, or removed
- Efficient: only syncs when actual changes occur

### Polling Mode

- Runs sync at configured intervals (1m, 5m, 15m, 30m, 1h)
- Good for systems where file watching is unreliable
- Less efficient but more predictable

### Logging

Logs are written to `~/.config/rewind-cli/sync.log` with automatic rotation:

- **Log Rotation**: Rotates when log file exceeds 10MB
- **Backup Retention**: Keeps last 5 backup files
- **Log Levels**: `error`, `warn`, `info`, `debug`
- **Format**: `[timestamp] [level] message {metadata}`

## Development

### File Structure

```
packages/cli/
├── src/
│   ├── commands/          # CLI commands
│   │   ├── start.ts
│   │   ├── stop.ts
│   │   ├── restart.ts
│   │   ├── status.tsx
│   │   ├── sync.ts
│   │   ├── config.tsx
│   │   └── logs.ts
│   ├── components/        # Ink UI components
│   │   ├── StatusDisplay.tsx
│   │   └── ConfigWizard.tsx
│   ├── services/          # Core services
│   │   ├── daemon.ts      # Daemon management
│   │   ├── sync.ts        # Sync service with file watching
│   │   └── api.ts         # API client
│   ├── utils/             # Utilities
│   │   ├── config.ts      # Configuration management
│   │   ├── logger.ts      # Logging utility
│   │   └── lock.ts        # Sync lock mechanism
│   └── index.ts           # CLI entry point
├── package.json
├── tsconfig.json
└── README.md
```

### Building

```bash
pnpm build
```

This compiles TypeScript to `dist/` and makes `dist/index.js` executable.

### Testing

```bash
# Run in development mode
pnpm dev status

# Test different commands
pnpm dev config
pnpm dev start
pnpm dev status
pnpm dev sync
pnpm dev stop
```

## Troubleshooting

### Daemon won't start

1. Check if API server is running:
   ```bash
   curl http://localhost:8429/api/health
   ```

2. Check configuration:
   ```bash
   rewind config --get apiUrl
   rewind config --get dataPath
   ```

3. View logs:
   ```bash
   rewind logs
   ```

### Sync not working

1. Check daemon status:
   ```bash
   rewind status
   ```

2. Check if lock is stuck:
   ```bash
   rewind status
   # Look for "Sync Lock: Locked" for extended periods
   ```

3. Try manual sync:
   ```bash
   rewind sync
   ```

4. Check logs for errors:
   ```bash
   rewind logs --lines 100
   ```

### API not accessible

1. Ensure API server is running:
   ```bash
   cd /path/to/rewind
   pnpm dev:api
   ```

2. Check API URL in config:
   ```bash
   rewind config --get apiUrl
   ```

3. Update API URL if needed:
   ```bash
   rewind config --set apiUrl=http://localhost:8429
   ```

## Future Enhancements

- [ ] Auto-start on system boot (launchd, systemd, Windows Service)
- [ ] Desktop notifications for sync events
- [ ] Web dashboard for CLI status
- [ ] Sync scheduling (only sync during specific hours)
- [ ] Multiple profile support
- [ ] Remote API support with authentication
