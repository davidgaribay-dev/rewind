import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { daemonManager } from '../services/daemon.js';
import { syncService } from '../services/sync.js';
import { syncLock } from '../utils/lock.js';
import { apiClient } from '../services/api.js';
import { config } from '../utils/config.js';

export const StatusDisplay: React.FC = () => {
  const [status, setStatus] = useState<{
    daemon: { isRunning: boolean; pid: number | null; uptime: number | null };
    sync: { lastSyncTime: Date | null; totalSyncs: number; failedSyncs: number };
    lock: { exists: boolean; info: any | null };
    api: { isHealthy: boolean };
    config: any;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      const daemonStatus = await daemonManager.getStatus();
      const syncStats = syncService.getStats();
      const lockExists = await syncLock.exists();
      const lockInfo = await syncLock.getInfo();
      const apiHealth = await apiClient.checkHealth();
      const currentConfig = config.getAll();

      setStatus({
        daemon: daemonStatus,
        sync: syncStats,
        lock: { exists: lockExists, info: lockInfo },
        api: { isHealthy: apiHealth },
        config: currentConfig,
      });

      setLoading(false);
    };

    fetchStatus();
  }, []);

  if (loading || !status) {
    return (
      <Box>
        <Text>
          <Spinner type="dots" /> Loading status...
        </Text>
      </Box>
    );
  }

  const formatUptime = (ms: number | null): string => {
    if (!ms) return 'N/A';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold underline>
          Rewind CLI Status
        </Text>
      </Box>

      {/* Daemon Status */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Daemon:</Text>
        <Box marginLeft={2}>
          <Text>
            Status: {status.daemon.isRunning ? <Text color="green">Running</Text> : <Text color="red">Stopped</Text>}
          </Text>
        </Box>
        {status.daemon.isRunning && (
          <>
            <Box marginLeft={2}>
              <Text>PID: {status.daemon.pid}</Text>
            </Box>
            <Box marginLeft={2}>
              <Text>Uptime: {formatUptime(status.daemon.uptime)}</Text>
            </Box>
          </>
        )}
      </Box>

      {/* Sync Status */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Sync:</Text>
        <Box marginLeft={2}>
          <Text>Last Sync: {formatDate(status.sync.lastSyncTime)}</Text>
        </Box>
        <Box marginLeft={2}>
          <Text>Total Syncs: {status.sync.totalSyncs}</Text>
        </Box>
        <Box marginLeft={2}>
          <Text>
            Failed Syncs:{' '}
            {status.sync.failedSyncs > 0 ? (
              <Text color="red">{status.sync.failedSyncs}</Text>
            ) : (
              <Text color="green">{status.sync.failedSyncs}</Text>
            )}
          </Text>
        </Box>
      </Box>

      {/* Lock Status */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Sync Lock:</Text>
        <Box marginLeft={2}>
          <Text>
            Status: {status.lock.exists ? <Text color="yellow">Locked</Text> : <Text color="green">Free</Text>}
          </Text>
        </Box>
        {status.lock.exists && status.lock.info && (
          <>
            <Box marginLeft={2}>
              <Text>Source: {status.lock.info.source}</Text>
            </Box>
            <Box marginLeft={2}>
              <Text>PID: {status.lock.info.pid}</Text>
            </Box>
          </>
        )}
      </Box>

      {/* API Status */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>API Server:</Text>
        <Box marginLeft={2}>
          <Text>
            Status: {status.api.isHealthy ? <Text color="green">Healthy</Text> : <Text color="red">Unreachable</Text>}
          </Text>
        </Box>
        <Box marginLeft={2}>
          <Text>URL: {status.config.apiUrl}</Text>
        </Box>
      </Box>

      {/* Configuration */}
      <Box flexDirection="column">
        <Text bold>Configuration:</Text>
        <Box marginLeft={2}>
          <Text>Data Path: {status.config.dataPath}</Text>
        </Box>
        <Box marginLeft={2}>
          <Text>
            Mode: {status.config.watchMode ? <Text color="cyan">File Watching</Text> : <Text color="cyan">Polling</Text>}
          </Text>
        </Box>
        {!status.config.watchMode && (
          <Box marginLeft={2}>
            <Text>Interval: {status.config.interval}</Text>
          </Box>
        )}
        <Box marginLeft={2}>
          <Text>Log Level: {status.config.logLevel}</Text>
        </Box>
      </Box>
    </Box>
  );
};
