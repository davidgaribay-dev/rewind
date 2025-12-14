#!/usr/bin/env node

import { Command } from 'commander';
import { startCommand } from './commands/start.js';
import { stopCommand } from './commands/stop.js';
import { restartCommand } from './commands/restart.js';
import { statusCommand } from './commands/status.js';
import { syncCommand } from './commands/sync.js';
import { configCommand } from './commands/config.js';
import { logsCommand } from './commands/logs.js';
import { daemonManager } from './services/daemon.js';

const program = new Command();

program
  .name('rewind')
  .description('CLI tool for automatic Rewind data synchronization')
  .version('0.1.0');

program
  .command('start')
  .description('Start the sync daemon in background')
  .action(async () => {
    await startCommand();
  });

program
  .command('stop')
  .description('Stop the sync daemon')
  .action(async () => {
    await stopCommand();
  });

program
  .command('restart')
  .description('Restart the sync daemon')
  .action(async () => {
    await restartCommand();
  });

program
  .command('status')
  .description('Show daemon and sync status')
  .action(async () => {
    await statusCommand();
  });

program
  .command('sync')
  .description('Trigger a manual sync immediately')
  .action(async () => {
    await syncCommand();
  });

program
  .command('config')
  .description('Configure the CLI (interactive wizard)')
  .option('-g, --get <key>', 'Get a configuration value')
  .option('-s, --set <key=value>', 'Set a configuration value')
  .option('-r, --reset', 'Reset configuration to defaults')
  .action(async options => {
    await configCommand(options);
  });

program
  .command('logs')
  .description('View sync logs')
  .option('-n, --lines <number>', 'Number of lines to display', '50')
  .option('-c, --clear', 'Clear all logs')
  .action(async options => {
    await logsCommand(options);
  });

// Hidden daemon command (used internally by start command)
program
  .command('daemon', { hidden: true })
  .description('Run daemon process (internal use only)')
  .action(async () => {
    await daemonManager.runDaemon();
  });

// Parse arguments
program.parse();
