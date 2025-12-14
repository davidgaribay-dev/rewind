import { daemonManager } from '../services/daemon.js';

export async function stopCommand(): Promise<void> {
  console.log('Stopping Rewind daemon...');

  const success = await daemonManager.stop();

  if (success) {
    console.log('✓ Daemon stopped successfully');
  } else {
    console.error('✗ Failed to stop daemon or daemon was not running');
    process.exit(1);
  }
}
