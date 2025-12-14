import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { ETLService } from '@/etl/service';
import { log } from '@/logger';
import type { ETLProgressEvent } from '@/etl/service';

const app = new Hono();

// Track ETL status
let etlStatus = {
  isRunning: false,
  lastRun: null as Date | null,
  lastError: null as string | null,
  lastSuccess: null as Date | null,
};

// POST /etl/run - Trigger ETL process
app.post('/run', async (c) => {
  if (etlStatus.isRunning) {
    return c.json({
      error: 'ETL process is already running',
      status: etlStatus
    }, 409);
  }

  // Run ETL in background
  etlStatus.isRunning = true;
  etlStatus.lastRun = new Date();
  etlStatus.lastError = null;

  // Don't await - let it run in background
  const etl = new ETLService();
  etl.run()
    .then(() => {
      etlStatus.isRunning = false;
      etlStatus.lastSuccess = new Date();
      log.info('ETL process completed successfully');
    })
    .catch((error) => {
      etlStatus.isRunning = false;
      etlStatus.lastError = error.message;
      log.error('ETL process failed:', error);
    });

  return c.json({
    message: 'ETL process started',
    status: etlStatus,
  });
});

// GET /etl/status - Get ETL status
app.get('/status', async (c) => {
  return c.json(etlStatus);
});

// GET /etl/stream - Stream ETL progress via Server-Sent Events
app.get('/stream', async (c) => {
  return streamSSE(c, async (stream) => {
    // Check if ETL is already running
    if (!etlStatus.isRunning) {
      // Start ETL process
      etlStatus.isRunning = true;
      etlStatus.lastRun = new Date();
      etlStatus.lastError = null;

      // Create ETL service with progress callback
      const etl = new ETLService((event) => {
        // Send progress event to client
        stream.writeSSE({
          data: JSON.stringify(event),
          event: event.type,
          id: Date.now().toString(),
        });
      });

      try {
        await etl.run();
        etlStatus.isRunning = false;
        etlStatus.lastSuccess = new Date();

        // Send completion event
        await stream.writeSSE({
          data: JSON.stringify({ message: 'ETL process completed' }),
          event: 'done',
        });
      } catch (error) {
        etlStatus.isRunning = false;
        etlStatus.lastError = error instanceof Error ? error.message : String(error);

        // Send error event
        await stream.writeSSE({
          data: JSON.stringify({
            message: 'ETL process failed',
            error: error instanceof Error ? error.message : String(error)
          }),
          event: 'error',
        });
      }
    } else {
      // ETL is already running, just send a message
      await stream.writeSSE({
        data: JSON.stringify({ message: 'ETL process is already running' }),
        event: 'info',
      });
    }
  });
});

export default app;
