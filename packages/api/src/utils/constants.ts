/**
 * Application-wide constants
 */

// Timeout constants (in milliseconds)
export const TIMEOUTS = {
  FILE_STAT: 10_000, // 10 seconds
  FILE_READ: 30_000, // 30 seconds
  DATABASE_SHUTDOWN: 5_000, // 5 seconds
  DEFAULT_OPERATION: 120_000, // 2 minutes
} as const;

// Database configuration
export const DATABASE_CONFIG = {
  MAX_CONNECTIONS: 10,
  IDLE_TIMEOUT: 20,
  CONNECT_TIMEOUT: 10,
} as const;

// Search configuration
export const SEARCH_CONFIG = {
  MAX_QUERY_LENGTH: 500,
  MAX_RESULTS: 50,
} as const;
