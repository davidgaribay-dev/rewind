import * as winston from 'winston';

// Custom format for emoji-based visual indicators (preserving existing UX)
const emojiFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level.toUpperCase()}]: ${message}${metaString}`;
});

// Determine log level from environment variable, default to 'info'
const logLevel = process.env.LOG_LEVEL || 'info';

// Create Winston logger instance
const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    emojiFormat
  ),
  transports: [
    // Console transport for all logs
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        emojiFormat
      ),
    }),
  ],
});

// Add file transports for production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );
}

// Convenience methods that preserve emoji-based logging style
export const log = {
  info: (message: string, ...meta: unknown[]) => logger.info(message, ...meta),
  error: (message: string, error?: Error | unknown, ...meta: unknown[]) => {
    if (error instanceof Error) {
      logger.error(message, { error: error.message, stack: error.stack, ...meta });
    } else if (error !== undefined) {
      logger.error(message, { error: String(error), ...meta });
    } else {
      logger.error(message, ...meta);
    }
  },
  warn: (message: string, ...meta: unknown[]) => logger.warn(message, ...meta),
  debug: (message: string, ...meta: unknown[]) => logger.debug(message, ...meta),
  verbose: (message: string, ...meta: unknown[]) => logger.verbose(message, ...meta),
};

export default logger;
