import { daemonManager } from '../services/daemon.js';

export async function restartCommand(): Promise<void> {
  console.log('Restarting Rewind daemon...');

  const success = await daemonManager.restart();

  if (success) {
    console.log('✓ Daemon restarted successfully');
  } else {
    console.error('✗ Failed to restart daemon');
    process.exit(1);
  }
}
