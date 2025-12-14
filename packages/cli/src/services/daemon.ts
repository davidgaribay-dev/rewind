import fs from 'fs/promises';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DaemonStatus {
  isRunning: boolean;
  pid: number | null;
  uptime: number | null;
  startTime: Date | null;
}

export class DaemonManager {
  private pidPath: string;

  constructor() {
    this.pidPath = config.getPidPath();
  }

  /**
   * Start daemon in background
   */
  async start(): Promise<boolean> {
    try {
      // Check if already running
      const status = await this.getStatus();
      if (status.isRunning) {
        console.log('Daemon is already running');
        return false;
      }

      // Get the CLI entry point
      const cliPath = path.resolve(__dirname, '..', 'index.js');

      // Spawn daemon process
      const child = spawn(process.execPath, [cliPath, 'daemon'], {
        detached: true,
        stdio: 'ignore',
        env: {
          ...process.env,
          REWIND_CLI_DAEMON: 'true',
        },
      });

      // Detach from parent
      child.unref();

      // Save PID
      const pidData = {
        pid: child.pid!,
        startTime: new Date().toISOString(),
      };

      await fs.mkdir(path.dirname(this.pidPath), { recursive: true });
      await fs.writeFile(this.pidPath, JSON.stringify(pidData, null, 2));

      console.log(`Daemon started with PID ${child.pid}`);
      return true;
    } catch (error) {
      await logger.error('Failed to start daemon', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Stop daemon
   */
  async stop(): Promise<boolean> {
    try {
      const status = await this.getStatus();

      if (!status.isRunning || !status.pid) {
        console.log('Daemon is not running');
        return false;
      }

      // Send SIGTERM to daemon
      process.kill(status.pid, 'SIGTERM');

      // Wait for process to exit
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if still running
      const stillRunning = await this.isProcessRunning(status.pid);

      if (stillRunning) {
        // Force kill
        process.kill(status.pid, 'SIGKILL');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Remove PID file
      await fs.unlink(this.pidPath);

      console.log('Daemon stopped');
      return true;
    } catch (error) {
      await logger.error('Failed to stop daemon', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Restart daemon
   */
  async restart(): Promise<boolean> {
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 1000));
    return await this.start();
  }

  /**
   * Get daemon status
   */
  async getStatus(): Promise<DaemonStatus> {
    try {
      const content = await fs.readFile(this.pidPath, 'utf-8');
      const data = JSON.parse(content);

      const isRunning = await this.isProcessRunning(data.pid);

      if (!isRunning) {
        // PID file exists but process is not running - clean up
        await fs.unlink(this.pidPath);
        return {
          isRunning: false,
          pid: null,
          uptime: null,
          startTime: null,
        };
      }

      const startTime = new Date(data.startTime);
      const uptime = Date.now() - startTime.getTime();

      return {
        isRunning: true,
        pid: data.pid,
        uptime,
        startTime,
      };
    } catch (error) {
      // PID file doesn't exist
      return {
        isRunning: false,
        pid: null,
        uptime: null,
        startTime: null,
      };
    }
  }

  /**
   * Check if process is running
   */
  private async isProcessRunning(pid: number): Promise<boolean> {
    try {
      // Sending signal 0 checks if process exists without killing it
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Run daemon loop (called by spawned process)
   */
  async runDaemon(): Promise<void> {
    const { syncService } = await import('./sync.js');

    // Handle graceful shutdown
    const shutdown = async () => {
      await logger.info('Daemon shutting down...');
      await syncService.stop();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    try {
      await logger.info('Daemon starting...');
      await syncService.start();

      // Keep process alive
      await new Promise(() => {
        // This promise never resolves, keeping the daemon running
      });
    } catch (error) {
      await logger.error('Daemon error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      process.exit(1);
    }
  }
}

export const daemonManager = new DaemonManager();
