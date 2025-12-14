import { useState, useEffect, useRef } from 'react';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { X, Download, Terminal } from 'lucide-react';
import { cn } from '~/lib/utils';

type ETLEvent = {
  type: 'start' | 'project' | 'conversation' | 'complete' | 'error' | 'info';
  message: string;
  data?: {
    projectName?: string;
    fileName?: string;
    messageCount?: number;
    totalProjects?: number;
    totalConversations?: number;
    error?: string;
  };
  timestamp: string;
};

interface ETLLogViewerProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function ETLLogViewer({ isOpen, onClose, onComplete }: ETLLogViewerProps) {
  const [logs, setLogs] = useState<ETLEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (isOpen && !isRunning) {
      startETL();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const startETL = () => {
    setLogs([]);
    setError(null);
    setIsRunning(true);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8429';
    const eventSource = new EventSource(`${API_URL}/api/etl/stream`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('start', (e) => {
      const event: ETLEvent = JSON.parse(e.data);
      setLogs((prev) => [...prev, event]);
    });

    eventSource.addEventListener('info', (e) => {
      const event: ETLEvent = JSON.parse(e.data);
      setLogs((prev) => [...prev, event]);
    });

    eventSource.addEventListener('project', (e) => {
      const event: ETLEvent = JSON.parse(e.data);
      setLogs((prev) => [...prev, event]);
    });

    eventSource.addEventListener('conversation', (e) => {
      const event: ETLEvent = JSON.parse(e.data);
      setLogs((prev) => [...prev, event]);
    });

    eventSource.addEventListener('complete', (e) => {
      const event: ETLEvent = JSON.parse(e.data);
      setLogs((prev) => [...prev, event]);
      setIsRunning(false);
      eventSource.close();
      onComplete?.();
    });

    eventSource.addEventListener('error', (e) => {
      if (e.data) {
        try {
          const event: ETLEvent = JSON.parse(e.data);
          setLogs((prev) => [...prev, event]);
          setError(event.message);
        } catch (parseError) {
          setError('Failed to parse error event');
        }
      }
      setIsRunning(false);
      eventSource.close();
    });

    eventSource.onerror = () => {
      setError('Connection to server lost');
      setIsRunning(false);
      eventSource.close();
    };
  };

  const downloadLogs = () => {
    const logText = logs
      .map((log) => `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}`)
      .join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `etl-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLogIcon = (type: ETLEvent['type']) => {
    switch (type) {
      case 'start':
        return '🚀';
      case 'project':
        return '📦';
      case 'conversation':
        return '💬';
      case 'complete':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '•';
    }
  };

  const getLogColor = (type: ETLEvent['type']) => {
    switch (type) {
      case 'start':
        return 'text-blue-600';
      case 'project':
        return 'text-purple-600';
      case 'conversation':
        return 'text-green-600';
      case 'complete':
        return 'text-green-600 font-semibold';
      case 'error':
        return 'text-red-600';
      case 'info':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl h-[600px] flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            <h2 className="text-lg font-semibold">ETL Process Logs</h2>
            {isRunning && (
              <span className="text-sm text-muted-foreground animate-pulse">Running...</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadLogs}
              disabled={logs.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={isRunning}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Logs Container */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-muted/30 text-foreground">
          {logs.length === 0 && !error ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Connecting to server...
            </div>
          ) : (
            <>
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={cn('mb-1 flex items-start gap-2', getLogColor(log.type))}
                >
                  <span className="text-muted-foreground select-none">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>
                  <span>{getLogIcon(log.type)}</span>
                  <span className="flex-1">{log.message}</span>
                </div>
              ))}
              {error && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded text-destructive">
                  <strong>Error:</strong> {error}
                </div>
              )}
              <div ref={logsEndRef} />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {logs.length} log {logs.length === 1 ? 'entry' : 'entries'}
          </div>
          <Button
            onClick={onClose}
            disabled={isRunning}
            variant={isRunning ? 'outline' : 'default'}
          >
            {isRunning ? 'Processing...' : 'Close'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
