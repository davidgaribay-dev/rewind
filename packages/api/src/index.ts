import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import * as dotenv from 'dotenv';

import projectsRouter from '@/routes/projects';
import conversationsRouter from '@/routes/conversations';
import etlRouter from '@/routes/etl';
import settingsRouter from '@/routes/settings';
import { log } from '@/logger';
import { validateEnvironment } from '@/utils/validation';

dotenv.config({ path: '../../.env' });

// Validate environment variables before starting the server
const envValidation = validateEnvironment();
if (!envValidation.valid) {
  log.error('Environment validation failed:');
  envValidation.errors.forEach(error => log.error(`  - ${error}`));
  process.exit(1);
}

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.WEB_URL || 'http://localhost:5173',
  credentials: true,
}));

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.route('/api/projects', projectsRouter);
app.route('/api/conversations', conversationsRouter);
app.route('/api/etl', etlRouter);
app.route('/api/settings', settingsRouter);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  log.error('Server error:', err);

  // In development, return detailed error information
  // In production, return generic error message
  const isDevelopment = process.env.NODE_ENV === 'development';

  return c.json(
    {
      error: 'Internal server error',
      ...(isDevelopment && {
        message: err.message,
        stack: err.stack,
      }),
    },
    500
  );
});

const port = parseInt(process.env.API_PORT || '3000');

log.info(`🚀 API Server starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  log.info(`✅ API Server running at http://localhost:${info.port}`);
});

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
  log.info(`${signal} received, starting graceful shutdown...`);

  try {
    // Close database connection
    const { closeDb } = await import('@/db/client');
    await closeDb();
    log.info('Database connection closed');

    // Exit process
    process.exit(0);
  } catch (error) {
    log.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
