import ora from 'ora';
import { syncService } from '../services/sync.js';

export async function syncCommand(): Promise<void> {
  const spinner = ora('Starting manual sync...').start();

  const success = await syncService.manualSync();

  if (success) {
    spinner.succeed('Sync completed successfully');
  } else {
    spinner.fail('Sync failed');
    process.exit(1);
  }
}
