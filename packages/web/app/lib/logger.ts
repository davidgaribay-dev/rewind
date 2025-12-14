/**
 * Browser-compatible logger utility
 * Provides structured logging in the browser with log levels and formatting
 */

type LogLevel = 'debug' | 'verbose' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: any[];
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    // Determine if we're in development mode
    // Handle both browser (Vite) and Node.js (testing) environments
    this.isDevelopment = (typeof import.meta !== 'undefined' && import.meta.env?.DEV) ||
                         process.env.NODE_ENV === 'development' ||
                         false;

    // Set log level based on environment
    // In production, only show warnings and errors by default
    this.logLevel = this.isDevelopment ? 'debug' : 'warn';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'verbose', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, meta?: unknown[]): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta: meta && meta.length > 0 ? meta : undefined,
    };
  }

  private logToConsole(level: LogLevel, message: string, ...meta: unknown[]) {
    if (!this.shouldLog(level)) return;

    const entry = this.formatMessage(level, message, meta);
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]:`;

    switch (level) {
      case 'error':
        console.error(prefix, message, ...meta);
        break;
      case 'warn':
        console.warn(prefix, message, ...meta);
        break;
      case 'info':
        console.info(prefix, message, ...meta);
        break;
      case 'debug':
      case 'verbose':
        console.log(prefix, message, ...meta);
        break;
    }
  }

  debug(message: string, ...meta: unknown[]) {
    this.logToConsole('debug', message, ...meta);
  }

  verbose(message: string, ...meta: unknown[]) {
    this.logToConsole('verbose', message, ...meta);
  }

  info(message: string, ...meta: unknown[]) {
    this.logToConsole('info', message, ...meta);
  }

  warn(message: string, ...meta: unknown[]) {
    this.logToConsole('warn', message, ...meta);
  }

  error(message: string, error?: Error | unknown, ...meta: unknown[]) {
    const errorMeta = error instanceof Error
      ? { error: error.message, stack: error.stack, ...meta }
      : error !== undefined
      ? { error: String(error), ...meta }
      : { ...meta };

    this.logToConsole('error', message, errorMeta);
  }

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  getLogLevel(): LogLevel {
    return this.logLevel;
  }
}

// Export singleton instance
const logger = new Logger();

// Convenience export
export const log = {
  debug: (message: string, ...meta: unknown[]) => logger.debug(message, ...meta),
  verbose: (message: string, ...meta: unknown[]) => logger.verbose(message, ...meta),
  info: (message: string, ...meta: unknown[]) => logger.info(message, ...meta),
  warn: (message: string, ...meta: unknown[]) => logger.warn(message, ...meta),
  error: (message: string, error?: unknown, ...meta: unknown[]) => logger.error(message, error, ...meta),
  setLogLevel: (level: LogLevel) => logger.setLogLevel(level),
  getLogLevel: () => logger.getLogLevel(),
};

export default logger;
