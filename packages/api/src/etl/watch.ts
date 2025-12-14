import chokidar from 'chokidar';
import type { FSWatcher } from 'chokidar';
import * as dotenv from 'dotenv';
import { ETLService } from '@/etl/service';
import { log } from '@/logger';

dotenv.config({ path: '../../.env' });

const DEBOUNCE_MS = 2000;

class ETLWatcher {
  private etl: ETLService;
  private rewindPath: string;
  private debounceTimer: NodeJS.Timeout | null = null;
  private changedFiles = new Set<string>();
  private watcher: FSWatcher | null = null;

  constructor() {
    this.etl = new ETLService();
    this.rewindPath = process.env.REWIND_DATA_PATH || '';

    if (!this.rewindPath) {
      throw new Error('REWIND_DATA_PATH environment variable is not set');
    }
  }

  async start() {
    log.info('👀 Starting file watcher...');
    log.info(`📁 Watching: ${this.rewindPath}`);

    // Run initial ETL
    log.info('🔄 Running initial ETL...');
    await this.etl.run();

    // Start watching for changes
    this.watcher = chokidar.watch(`${this.rewindPath}/**/*.jsonl`, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      }
    });

    this.watcher
      .on('add', (path) => this.handleChange('added', path))
      .on('change', (path) => this.handleChange('changed', path))
      .on('unlink', (path) => this.handleChange('removed', path))
      .on('error', (error) => log.error('Watcher error:', error));

    log.info('✅ File watcher active');
    log.info('Press Ctrl+C to stop\n');
  }

  async stop() {
    log.info('Stopping file watcher...');

    // Clear any pending timers
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // Close the watcher
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    // Close database connection
    const { closeDb } = await import('@/db/client');
    await closeDb();

    log.info('File watcher stopped');
  }

  private handleChange(event: string, filePath: string) {
    log.info(`📝 File ${event}: ${filePath}`);
    this.changedFiles.add(filePath);

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.runIncrementalETL();
    }, DEBOUNCE_MS);
  }

  private async runIncrementalETL() {
    const fileCount = this.changedFiles.size;
    log.info(`\n🔄 Processing ${fileCount} changed file(s)...`);
    this.changedFiles.clear();

    try {
      await this.etl.run();
      log.info('✅ Incremental ETL completed\n');
    } catch (error) {
      log.error('❌ Incremental ETL failed:', error);
    }
  }
}

const watcherInstance = new ETLWatcher();
watcherInstance.start().catch((error) => {
  log.error('Failed to start watcher:', error);
  process.exit(1);
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  log.info(`\n${signal} received, shutting down watcher...`);
  try {
    await watcherInstance.stop();
    process.exit(0);
  } catch (error) {
    log.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
