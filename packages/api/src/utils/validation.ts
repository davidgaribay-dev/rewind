/**
 * Validation utilities for input sanitization and security
 */

import { SEARCH_CONFIG } from './constants';

/**
 * UUID v4 regex pattern
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID v4
 */
export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Validates if a string is a valid UUID or a safe alphanumeric ID
 * (for backward compatibility with rewind conversation IDs)
 */
export function isValidId(value: string): boolean {
  // Allow UUIDs or safe alphanumeric strings (letters, numbers, hyphens, underscores)
  return UUID_REGEX.test(value) || /^[a-zA-Z0-9_-]+$/.test(value);
}

/**
 * Validates and sanitizes search query input
 * Prevents excessively long queries that could cause performance issues
 */
export function validateSearchQuery(query: string | undefined): { valid: boolean; error?: string; sanitized?: string } {
  if (!query) {
    return { valid: false, error: 'Query parameter is required' };
  }

  if (typeof query !== 'string') {
    return { valid: false, error: 'Query must be a string' };
  }

  // Limit query length to prevent performance issues
  if (query.length > SEARCH_CONFIG.MAX_QUERY_LENGTH) {
    return { valid: false, error: `Query too long (max ${SEARCH_CONFIG.MAX_QUERY_LENGTH} characters)` };
  }

  // Trim whitespace
  const sanitized = query.trim();

  if (sanitized.length === 0) {
    return { valid: false, error: 'Query cannot be empty' };
  }

  return { valid: true, sanitized };
}

/**
 * Validates environment variables on startup
 */
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required environment variables
  const required = {
    DATABASE_URL: process.env.DATABASE_URL,
    REWIND_DATA_PATH: process.env.REWIND_DATA_PATH,
  };

  for (const [key, value] of Object.entries(required)) {
    if (!value || value.trim().length === 0) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  // Validate DATABASE_URL format
  if (required.DATABASE_URL && !required.DATABASE_URL.startsWith('postgresql://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  // Validate REWIND_DATA_PATH exists (basic check)
  if (required.REWIND_DATA_PATH && required.REWIND_DATA_PATH.includes('${')) {
    errors.push('REWIND_DATA_PATH contains unresolved template variables');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
