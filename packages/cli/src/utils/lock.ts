import fs from 'fs/promises';
import { config } from './config.js';

export class SyncLock {
  private lockPath: string;
  private lockCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.lockPath = config.getLockPath();
  }

  /**
   * Attempt to acquire the sync lock
   * Returns true if lock acquired, false if another process holds it
   */
  async acquire(): Promise<boolean> {
    try {
      // Check if lock file exists
      const lockExists = await this.exists();

      if (lockExists) {
        // Check if lock is stale (older than 5 minutes)
        const stats = await fs.stat(this.lockPath);
        const lockAge = Date.now() - stats.mtimeMs;
        const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

        if (lockAge > STALE_THRESHOLD) {
          // Lock is stale, remove it
          await this.release();
        } else {
          // Active lock held by another process
          return false;
        }
      }

      // Create lock file
      const lockData = {
        pid: process.pid,
        timestamp: new Date().toISOString(),
        source: 'cli',
      };

      await fs.writeFile(this.lockPath, JSON.stringify(lockData, null, 2));

      // Start heartbeat to keep lock fresh
      this.startHeartbeat();

      return true;
    } catch (error) {
      console.error('Failed to acquire lock:', error);
      return false;
    }
  }

  /**
   * Release the sync lock
   */
  async release(): Promise<void> {
    try {
      this.stopHeartbeat();
      await fs.unlink(this.lockPath);
    } catch (error) {
      // Ignore errors if lock file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Failed to release lock:', error);
      }
    }
  }

  /**
   * Check if lock exists
   */
  async exists(): Promise<boolean> {
    try {
      await fs.access(this.lockPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get lock information if it exists
   */
  async getInfo(): Promise<{ pid: number; timestamp: string; source: string } | null> {
    try {
      const content = await fs.readFile(this.lockPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Update lock timestamp to indicate activity (heartbeat)
   */
  private async updateTimestamp(): Promise<void> {
    try {
      const lockInfo = await this.getInfo();
      if (lockInfo && lockInfo.pid === process.pid) {
        await fs.writeFile(
          this.lockPath,
          JSON.stringify({ ...lockInfo, timestamp: new Date().toISOString() }, null, 2)
        );
      }
    } catch (error) {
      console.error('Failed to update lock timestamp:', error);
    }
  }

  /**
   * Start heartbeat to keep lock fresh
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    // Update lock every minute
    this.lockCheckInterval = setInterval(() => {
      this.updateTimestamp();
    }, 60 * 1000);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.lockCheckInterval) {
      clearInterval(this.lockCheckInterval);
      this.lockCheckInterval = null;
    }
  }

  /**
   * Wait for lock to be available
   */
  async waitForRelease(timeoutMs: number = 30000): Promise<boolean> {
    const startTime = Date.now();

    while (await this.exists()) {
      if (Date.now() - startTime > timeoutMs) {
        return false;
      }

      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return true;
  }
}

export const syncLock = new SyncLock();
