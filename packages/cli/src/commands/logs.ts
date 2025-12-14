import { logger } from '../utils/logger.js';

export async function logsCommand(options: { lines?: string; clear?: boolean }): Promise<void> {
  if (options.clear) {
    await logger.clearLogs();
    console.log('✓ Logs cleared');
    return;
  }

  const lines = options.lines ? parseInt(options.lines, 10) : 50;
  const logs = await logger.getLogs(lines);

  if (!logs) {
    console.log('No logs available');
    return;
  }

  console.log(logs);
}
