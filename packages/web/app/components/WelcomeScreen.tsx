import { FolderOpen, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { isFileSystemAccessSupported } from '~/lib/fileSystem';

interface WelcomeScreenProps {
  onOpenFolder: () => void;
}

export function WelcomeScreen({ onOpenFolder }: WelcomeScreenProps) {
  const isSupported = isFileSystemAccessSupported();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-8">
      <div className="max-w-2xl w-full space-y-6">
        {!isSupported && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Browser Not Supported</AlertTitle>
            <AlertDescription>
              Your browser doesn't support the File System Access API. Please use a Chromium-based
              browser (Chrome, Edge, or Brave) to use this application.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <FolderOpen className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-3xl">Enterprise AI Governance Platform</CardTitle>
            <CardDescription className="text-base mt-4">
              Comprehensive monitoring, auditability, and cost management for AI-assisted development
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Configuration Steps</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Configure data source path via Settings</li>
                <li>Initialize the data pipeline to process AI conversations</li>
                <li>Grant necessary permissions when prompted</li>
                <li>Begin monitoring your AI development workflows</li>
              </ol>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Enterprise Capabilities</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Complete audit trail of all AI interactions and tool executions</li>
                <li>Granular cost analytics with token-level tracking</li>
                <li>Compliance-ready reporting for regulatory requirements</li>
                <li>Full-text search across conversation history</li>
                <li>Real-time monitoring and performance metrics</li>
              </ul>
            </div>

            <div className="flex justify-center pt-4">
              <Button size="lg" onClick={onOpenFolder} disabled={!isSupported}>
                <FolderOpen className="mr-2 h-5 w-5" />
                Configure Data Source
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
