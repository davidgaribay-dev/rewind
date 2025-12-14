import { config } from '../utils/config.js';

export interface ETLStatus {
  isRunning: boolean;
  lastRun: string | null;
  currentProgress?: {
    projectsProcessed: number;
    conversationsProcessed: number;
    totalProjects: number;
  };
}

export interface APIHealth {
  status: string;
  timestamp: string;
}

export class APIClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || config.get('apiUrl');
  }

  /**
   * Check if API is healthy and reachable
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as APIHealth;
      return data.status === 'ok';
    } catch (error) {
      return false;
    }
  }

  /**
   * Trigger ETL sync
   */
  async triggerSync(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/etl/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, message: error };
      }

      const data = (await response.json()) as { message?: string };
      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get ETL status
   */
  async getETLStatus(): Promise<ETLStatus | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/etl/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return null;
      }

      return (await response.json()) as ETLStatus;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get current data path from settings
   */
  async getDataPath(): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/settings/data-path`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as { dataPath?: string };
      return data.dataPath || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update data path in settings
   */
  async setDataPath(dataPath: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/settings/data-path`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dataPath }),
        signal: AbortSignal.timeout(5000),
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test data path validity
   */
  async testDataPath(
    dataPath: string
  ): Promise<{ valid: boolean; projectCount?: number; conversationCount?: number; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/settings/test-path`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dataPath }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        const error = await response.text();
        return { valid: false, error };
      }

      return (await response.json()) as { valid: boolean; projectCount?: number; conversationCount?: number; error?: string };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const apiClient = new APIClient();
