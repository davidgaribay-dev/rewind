import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { DATABASE_CONFIG, TIMEOUTS } from '@/utils/constants';

// Singleton pattern for database connection
type Database = ReturnType<typeof createDb>;
let db: Database | null = null;
let client: ReturnType<typeof postgres> | null = null;

function createDb(client: ReturnType<typeof postgres>) {
  return drizzle(client, { schema });
}

export function getDb(): Database {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    client = postgres(connectionString, {
      max: DATABASE_CONFIG.MAX_CONNECTIONS,
      idle_timeout: DATABASE_CONFIG.IDLE_TIMEOUT,
      connect_timeout: DATABASE_CONFIG.CONNECT_TIMEOUT,
    });

    db = createDb(client);
  }

  return db;
}

/**
 * Gracefully close database connection
 * Call this on process shutdown
 */
export async function closeDb(): Promise<void> {
  if (client) {
    await client.end({ timeout: TIMEOUTS.DATABASE_SHUTDOWN });
    client = null;
    db = null;
  }
}

export { schema };
