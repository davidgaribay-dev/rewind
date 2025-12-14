import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import { config, CLIConfig } from '../utils/config.js';
import { apiClient } from '../services/api.js';

interface Props {
  onComplete: () => void;
}

type Step = 'apiUrl' | 'dataPath' | 'mode' | 'interval' | 'logLevel' | 'confirm';

export const ConfigWizard: React.FC<Props> = ({ onComplete }) => {
  const currentConfig = config.getAll();

  const [step, setStep] = useState<Step>('apiUrl');
  const [formData, setFormData] = useState<Partial<CLIConfig>>(currentConfig);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleApiUrlSubmit = (value: string) => {
    setFormData({ ...formData, apiUrl: value });
    setStep('dataPath');
  };

  const handleDataPathSubmit = async (value: string) => {
    setFormData({ ...formData, dataPath: value });

    // Test the data path
    setTesting(true);
    const result = await apiClient.testDataPath(value);
    setTesting(false);

    if (result.valid) {
      setTestResult(`Found ${result.projectCount} projects, ${result.conversationCount} conversations`);
      setTimeout(() => {
        setStep('mode');
      }, 2000);
    } else {
      setTestResult(`Error: ${result.error}`);
      // Stay on this step to allow correction
    }
  };

  const handleModeSelect = (item: { value: string }) => {
    setFormData({ ...formData, watchMode: item.value === 'watch' });

    if (item.value === 'poll') {
      setStep('interval');
    } else {
      setStep('logLevel');
    }
  };

  const handleIntervalSelect = (item: { value: string }) => {
    setFormData({ ...formData, interval: item.value });
    setStep('logLevel');
  };

  const handleLogLevelSelect = (item: { value: string }) => {
    setFormData({ ...formData, logLevel: item.value as CLIConfig['logLevel'] });
    setStep('confirm');
  };

  const handleConfirm = async (item: { value: string }) => {
    if (item.value === 'save') {
      // Save configuration
      config.setAll(formData);

      // Sync data path to database
      if (formData.dataPath) {
        await apiClient.setDataPath(formData.dataPath);
      }

      onComplete();
    } else {
      // Restart wizard
      setStep('apiUrl');
      setTestResult(null);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold underline>
          Configuration Wizard
        </Text>
      </Box>

      {step === 'apiUrl' && (
        <Box flexDirection="column">
          <Text>API URL:</Text>
          <Box marginLeft={2}>
            <TextInput value={formData.apiUrl || currentConfig.apiUrl} onChange={() => {}} onSubmit={handleApiUrlSubmit} />
          </Box>
          <Box marginTop={1}>
            <Text dimColor>Default: http://localhost:8429</Text>
          </Box>
        </Box>
      )}

      {step === 'dataPath' && (
        <Box flexDirection="column">
          <Text>Data Path (Claude projects directory):</Text>
          <Box marginLeft={2}>
            <TextInput value={formData.dataPath || currentConfig.dataPath} onChange={() => {}} onSubmit={handleDataPathSubmit} />
          </Box>
          {testing && (
            <Box marginTop={1}>
              <Text>
                <Spinner type="dots" /> Testing path...
              </Text>
            </Box>
          )}
          {testResult && (
            <Box marginTop={1}>
              <Text color={testResult.startsWith('Error') ? 'red' : 'green'}>{testResult}</Text>
            </Box>
          )}
          <Box marginTop={1}>
            <Text dimColor>Example: ~/.claude/projects</Text>
          </Box>
        </Box>
      )}

      {step === 'mode' && (
        <Box flexDirection="column">
          <Text>Sync Mode:</Text>
          <SelectInput
            items={[
              { label: 'File Watching (recommended)', value: 'watch' },
              { label: 'Polling', value: 'poll' },
            ]}
            onSelect={handleModeSelect}
          />
        </Box>
      )}

      {step === 'interval' && (
        <Box flexDirection="column">
          <Text>Polling Interval:</Text>
          <SelectInput
            items={[
              { label: '1 minute', value: '1m' },
              { label: '5 minutes', value: '5m' },
              { label: '15 minutes', value: '15m' },
              { label: '30 minutes', value: '30m' },
              { label: '1 hour', value: '1h' },
            ]}
            onSelect={handleIntervalSelect}
          />
        </Box>
      )}

      {step === 'logLevel' && (
        <Box flexDirection="column">
          <Text>Log Level:</Text>
          <SelectInput
            items={[
              { label: 'Error', value: 'error' },
              { label: 'Warn', value: 'warn' },
              { label: 'Info (recommended)', value: 'info' },
              { label: 'Debug', value: 'debug' },
            ]}
            onSelect={handleLogLevelSelect}
          />
        </Box>
      )}

      {step === 'confirm' && (
        <Box flexDirection="column">
          <Text bold>Review Configuration:</Text>
          <Box marginLeft={2} flexDirection="column" marginTop={1}>
            <Text>API URL: {formData.apiUrl}</Text>
            <Text>Data Path: {formData.dataPath}</Text>
            <Text>Mode: {formData.watchMode ? 'File Watching' : `Polling (${formData.interval})`}</Text>
            <Text>Log Level: {formData.logLevel}</Text>
          </Box>
          <Box marginTop={1}>
            <SelectInput
              items={[
                { label: 'Save Configuration', value: 'save' },
                { label: 'Start Over', value: 'restart' },
              ]}
              onSelect={handleConfirm}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};
