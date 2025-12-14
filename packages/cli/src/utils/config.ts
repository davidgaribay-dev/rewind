import Conf from 'conf';
import os from 'os';
import path from 'path';

export interface CLIConfig {
  apiUrl: string;
  dataPath: string;
  interval: string; // e.g., '5m', '1h'
  watchMode: boolean; // true = file watching, false = polling
  autoStart: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

const DEFAULT_CONFIG: CLIConfig = {
  apiUrl: 'http://localhost:8429',
  dataPath: path.join(os.homedir(), '.claude', 'projects'),
  interval: '5m',
  watchMode: true,
  autoStart: false,
  logLevel: 'info',
};

class ConfigManager {
  private conf: Conf<CLIConfig>;

  constructor() {
    this.conf = new Conf<CLIConfig>({
      projectName: 'rewind-cli',
      defaults: DEFAULT_CONFIG,
    });
  }

  get<K extends keyof CLIConfig>(key: K): CLIConfig[K] {
    return this.conf.get(key);
  }

  set<K extends keyof CLIConfig>(key: K, value: CLIConfig[K]): void {
    this.conf.set(key, value);
  }

  getAll(): CLIConfig {
    return this.conf.store;
  }

  setAll(config: Partial<CLIConfig>): void {
    Object.entries(config).forEach(([key, value]) => {
      this.conf.set(key as keyof CLIConfig, value);
    });
  }

  reset(): void {
    this.conf.clear();
  }

  getConfigPath(): string {
    return this.conf.path;
  }

  getLogPath(): string {
    return path.join(path.dirname(this.conf.path), 'sync.log');
  }

  getPidPath(): string {
    return path.join(path.dirname(this.conf.path), 'daemon.pid');
  }

  getLockPath(): string {
    return path.join(path.dirname(this.conf.path), 'sync.lock');
  }
}

export const config = new ConfigManager();
