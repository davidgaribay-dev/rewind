import fs from 'fs/promises';
import path from 'path';
import { config } from './config.js';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

class Logger {
  private logPath: string;

  constructor() {
    this.logPath = config.getLogPath();
  }

  private shouldLog(level: LogLevel): boolean {
    const configLevel = config.get('logLevel');
    return LOG_LEVELS[level] <= LOG_LEVELS[configLevel];
  }

  private formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
  }

  private async writeToFile(message: string): Promise<void> {
    try {
      // Ensure log directory exists
      await fs.mkdir(path.dirname(this.logPath), { recursive: true });

      // Append to log file
      await fs.appendFile(this.logPath, message);

      // Rotate log if it's too large (>10MB)
      const stats = await fs.stat(this.logPath);
      if (stats.size > 10 * 1024 * 1024) {
        await this.rotateLog();
      }
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private async rotateLog(): Promise<void> {
    try {
      const backupPath = `${this.logPath}.${Date.now()}.bak`;
      await fs.rename(this.logPath, backupPath);

      // Keep only last 5 backup files
      const logDir = path.dirname(this.logPath);
      const files = await fs.readdir(logDir);
      const backups = files
        .filter(f => f.endsWith('.bak'))
        .map(f => path.join(logDir, f))
        .sort();

      if (backups.length > 5) {
        for (const backup of backups.slice(0, backups.length - 5)) {
          await fs.unlink(backup);
        }
      }
    } catch (error) {
      console.error('Failed to rotate log:', error);
    }
  }

  async error(message: string, meta?: Record<string, unknown>): Promise<void> {
    if (this.shouldLog('error')) {
      const formatted = this.formatMessage('error', message, meta);
      console.error(message, meta);
      await this.writeToFile(formatted);
    }
  }

  async warn(message: string, meta?: Record<string, unknown>): Promise<void> {
    if (this.shouldLog('warn')) {
      const formatted = this.formatMessage('warn', message, meta);
      console.warn(message, meta);
      await this.writeToFile(formatted);
    }
  }

  async info(message: string, meta?: Record<string, unknown>): Promise<void> {
    if (this.shouldLog('info')) {
      const formatted = this.formatMessage('info', message, meta);
      console.log(message, meta);
      await this.writeToFile(formatted);
    }
  }

  async debug(message: string, meta?: Record<string, unknown>): Promise<void> {
    if (this.shouldLog('debug')) {
      const formatted = this.formatMessage('debug', message, meta);
      console.log(message, meta);
      await this.writeToFile(formatted);
    }
  }

  async clearLogs(): Promise<void> {
    try {
      await fs.unlink(this.logPath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }

  async getLogs(lines: number = 50): Promise<string> {
    try {
      const content = await fs.readFile(this.logPath, 'utf-8');
      const allLines = content.split('\n').filter(Boolean);
      return allLines.slice(-lines).join('\n');
    } catch (error) {
      return '';
    }
  }
}

export const logger = new Logger();
