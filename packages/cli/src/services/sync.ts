import chokidar, { FSWatcher } from 'chokidar';
import debounce from 'debounce';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { syncLock } from '../utils/lock.js';
import { apiClient } from './api.js';

export interface SyncStats {
  lastSyncTime: Date | null;
  totalSyncs: number;
  failedSyncs: number;
  filesWatched: number;
}

export class SyncService {
  private watcher: FSWatcher | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private stats: SyncStats = {
    lastSyncTime: null,
    totalSyncs: 0,
    failedSyncs: 0,
    filesWatched: 0,
  };
  private isRunning = false;
  private debouncedSync: (() => void) | null = null;

  /**
   * Start the sync service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      await logger.warn('Sync service is already running');
      return;
    }

    // Check if API is accessible
    const isHealthy = await apiClient.checkHealth();
    if (!isHealthy) {
      await logger.error('API server is not accessible. Please start the API server first.');
      throw new Error('API server is not accessible');
    }

    this.isRunning = true;

    // Create debounced sync function (wait 3 seconds after last change)
    this.debouncedSync = debounce(async () => {
      await this.performSync();
    }, 3000);

    const watchMode = config.get('watchMode');

    if (watchMode) {
      await this.startWatching();
    } else {
      await this.startPolling();
    }

    await logger.info('Sync service started', {
      mode: watchMode ? 'watch' : 'poll',
      dataPath: config.get('dataPath'),
    });
  }

  /**
   * Stop the sync service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Stop watching or polling
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    // Release lock
    await syncLock.release();

    await logger.info('Sync service stopped');
  }

  /**
   * Start file watching mode
   */
  private async startWatching(): Promise<void> {
    const dataPath = config.get('dataPath');

    await logger.info('Starting file watcher', { dataPath });

    this.watcher = chokidar.watch('**/*.jsonl', {
      cwd: dataPath,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100,
      },
    });

    this.watcher.on('add', async path => {
      await logger.debug('File added', { path });
      if (this.debouncedSync) {
        this.debouncedSync();
      }
    });

    this.watcher.on('change', async path => {
      await logger.debug('File changed', { path });
      if (this.debouncedSync) {
        this.debouncedSync();
      }
    });

    this.watcher.on('unlink', async path => {
      await logger.debug('File removed', { path });
      if (this.debouncedSync) {
        this.debouncedSync();
      }
    });

    this.watcher.on('error', (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Watcher error', { error: errorMessage });
    });

    this.watcher.on('ready', () => {
      const watched = this.watcher?.getWatched();
      if (watched) {
        const fileCount = Object.values(watched).reduce((sum, files) => sum + files.length, 0);
        this.stats.filesWatched = fileCount;
      }
    });
  }

  /**
   * Start polling mode
   */
  private async startPolling(): Promise<void> {
    const interval = this.parseInterval(config.get('interval'));

    await logger.info('Starting polling mode', {
      interval: config.get('interval'),
      intervalMs: interval,
    });

    // Perform initial sync
    await this.performSync();

    // Set up polling
    this.pollInterval = setInterval(async () => {
      await this.performSync();
    }, interval);
  }

  /**
   * Perform a sync operation
   */
  private async performSync(): Promise<void> {
    try {
      // Try to acquire lock
      const lockAcquired = await syncLock.acquire();

      if (!lockAcquired) {
        await logger.info('Sync already in progress, skipping...');
        return;
      }

      await logger.info('Starting sync...');

      // Trigger ETL via API
      const result = await apiClient.triggerSync();

      if (result.success) {
        this.stats.lastSyncTime = new Date();
        this.stats.totalSyncs++;
        await logger.info('Sync completed successfully', { message: result.message });
      } else {
        this.stats.failedSyncs++;
        await logger.error('Sync failed', { message: result.message });
      }
    } catch (error) {
      this.stats.failedSyncs++;
      await logger.error('Sync error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      // Always release lock
      await syncLock.release();
    }
  }

  /**
   * Parse interval string (e.g., '5m', '1h') to milliseconds
   */
  private parseInterval(interval: string): number {
    const match = interval.match(/^(\d+)([mh])$/);

    if (!match) {
      // Default to 5 minutes
      return 5 * 60 * 1000;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    if (unit === 'm') {
      return value * 60 * 1000;
    } else if (unit === 'h') {
      return value * 60 * 60 * 1000;
    }

    return 5 * 60 * 1000;
  }

  /**
   * Get current stats
   */
  getStats(): SyncStats {
    return { ...this.stats };
  }

  /**
   * Check if service is running
   */
  isServiceRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Perform manual sync (for CLI commands)
   */
  async manualSync(): Promise<boolean> {
    try {
      // Check if API is accessible
      const isHealthy = await apiClient.checkHealth();
      if (!isHealthy) {
        await logger.error('API server is not accessible');
        return false;
      }

      // Try to acquire lock with timeout
      const lockAcquired = await syncLock.acquire();

      if (!lockAcquired) {
        // Wait for lock to be released
        await logger.info('Another sync is in progress, waiting...');
        const released = await syncLock.waitForRelease(30000);

        if (!released) {
          await logger.error('Timeout waiting for sync lock');
          return false;
        }

        // Try to acquire again
        const retryAcquired = await syncLock.acquire();
        if (!retryAcquired) {
          await logger.error('Failed to acquire sync lock');
          return false;
        }
      }

      await logger.info('Starting manual sync...');

      const result = await apiClient.triggerSync();

      if (result.success) {
        await logger.info('Manual sync completed successfully');
        return true;
      } else {
        await logger.error('Manual sync failed', { message: result.message });
        return false;
      }
    } catch (error) {
      await logger.error('Manual sync error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    } finally {
      await syncLock.release();
    }
  }
}

export const syncService = new SyncService();
