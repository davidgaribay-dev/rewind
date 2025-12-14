import { daemonManager } from '../services/daemon.js';

export async function startCommand(): Promise<void> {
  console.log('Starting Rewind daemon...');

  const success = await daemonManager.start();

  if (success) {
    console.log('✓ Daemon started successfully');
    console.log('Use "rewind status" to check daemon status');
    console.log('Use "rewind logs" to view sync logs');
  } else {
    console.error('✗ Failed to start daemon');
    process.exit(1);
  }
}
