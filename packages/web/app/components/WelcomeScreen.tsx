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
            <CardTitle className="text-3xl">Welcome to Claude Projects Viewer</CardTitle>
            <CardDescription className="text-base mt-4">
              Browse and visualize your Claude Code conversation history
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Getting Started</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Click the "Open Folder" button below</li>
                <li>Navigate to your <code className="text-xs bg-muted px-1 py-0.5 rounded">.claude/projects</code> directory</li>
                <li>Grant read permission when prompted</li>
                <li>Explore your conversation history!</li>
              </ol>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Features</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Browse all your Claude Code projects and conversations</li>
                <li>View detailed conversation history with formatted messages</li>
                <li>Analyze token usage and model distribution</li>
                <li>Search and filter conversations</li>
                <li>View statistics and activity timelines</li>
              </ul>
            </div>

            <div className="flex justify-center pt-4">
              <Button size="lg" onClick={onOpenFolder} disabled={!isSupported}>
                <FolderOpen className="mr-2 h-5 w-5" />
                Open .claude/projects Folder
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
