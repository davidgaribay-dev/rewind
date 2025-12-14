import { useState, useEffect } from 'react';
import type { Route } from './+types/settings';
import { Navbar } from '~/components/Navbar';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { ScrollArea } from '~/components/ui/scroll-area';
import { useToast } from '~/hooks/use-toast';
import { Badge } from '~/components/ui/badge';
import { FolderOpen, CheckCircle2, XCircle, ChevronRight, Home, ArrowUp, Folder, FolderCheck } from 'lucide-react';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Settings - Claude Projects Viewer' },
    { name: 'description', content: 'Configure your Rewind data path' },
  ];
}

interface Directory {
  name: string;
  path: string;
  hasConversations: boolean;
}

interface BrowseResponse {
  currentPath: string;
  parentPath: string | null;
  directories: Directory[];
}

export default function Settings() {
  const [selectedPath, setSelectedPath] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string; projectCount?: number; conversationCount?: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load current saved path
    fetch('http://localhost:3000/api/settings/data-path')
      .then(res => res.json())
      .then(data => {
        if (data.path) {
          setSelectedPath(data.path);
          browseTo(data.path);
        } else {
          // Start at home directory
          browseTo('');
        }
      })
      .catch(console.error);
  }, []);

  const browseTo = async (path: string) => {
    setLoading(true);
    try {
      const params = path ? `?path=${encodeURIComponent(path)}` : '';
      const response = await fetch(`http://localhost:3000/api/settings/browse${params}`);
      const data: BrowseResponse = await response.json();

      setCurrentPath(data.currentPath || '');
      setDirectories(data.directories || []);
      setParentPath(data.parentPath || null);
    } catch (error) {
      toast({
        title: 'Browse Failed',
        description: error instanceof Error ? error.message : 'Failed to browse directory',
        variant: 'destructive',
      });
      // Reset to safe state on error
      setDirectories([]);
    } finally {
      setLoading(false);
    }
  };

  const testPath = async () => {
    if (!selectedPath) return;

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('http://localhost:3000/api/settings/test-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedPath }),
      });

      const result = await response.json();
      setTestResult(result);

      if (result.valid) {
        toast({
          title: 'Path Valid',
          description: `Found ${result.projectCount} projects with ${result.conversationCount} conversations.`,
        });
      } else {
        toast({
          title: 'Invalid Path',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: error instanceof Error ? error.message : 'Failed to test path',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const savePath = async () => {
    if (!selectedPath) return;

    try {
      const response = await fetch('http://localhost:3000/api/settings/data-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedPath }),
      });

      if (response.ok) {
        toast({
          title: 'Settings Saved',
          description: 'Your Rewind data path has been updated.',
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold mb-8">Settings</h1>

          <Card>
            <CardHeader>
              <CardTitle>Rewind Data Path</CardTitle>
              <CardDescription>
                Browse and select the location of your Claude Code conversation data.
                This is typically located at <code className="text-sm bg-muted px-1 rounded">~/.claude</code> or
                <code className="text-sm bg-muted px-1 rounded">~/Library/Application Support/Claude</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Path Display */}
              <div className="space-y-2">
                <Label>Current Directory</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono truncate">
                    {currentPath || 'Loading...'}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => browseTo('')}
                    disabled={loading}
                  >
                    <Home className="h-4 w-4" />
                  </Button>
                  {parentPath && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => browseTo(parentPath)}
                      disabled={loading}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Directory Browser */}
              <div className="space-y-2">
                <Label>Browse Directories</Label>
                <ScrollArea className="h-[300px] border rounded-md">
                  <div className="p-2">
                    {loading ? (
                      <div className="flex items-center justify-center h-40 text-muted-foreground">
                        Loading directories...
                      </div>
                    ) : directories.length === 0 ? (
                      <div className="flex items-center justify-center h-40 text-muted-foreground">
                        No subdirectories found
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {directories.map((dir) => (
                          <div
                            key={dir.path}
                            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                              selectedPath === dir.path
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="flex-1 flex items-center gap-2" onClick={() => setSelectedPath(dir.path)}>
                              {dir.hasConversations ? (
                                <FolderCheck className="h-4 w-4 text-green-600" />
                              ) : (
                                <Folder className="h-4 w-4" />
                              )}
                              <span className="text-sm truncate">{dir.name}</span>
                              {dir.hasConversations && (
                                <Badge variant="secondary" className="text-xs">
                                  Has conversations
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => browseTo(dir.path)}
                              className="h-6 w-6 p-0"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Selected Path Display */}
              <div className="space-y-2">
                <Label>Selected Path</Label>
                <div className="px-3 py-2 bg-muted rounded-md text-sm font-mono truncate">
                  {selectedPath || 'No path selected'}
                </div>
              </div>

              {/* Test Result */}
              {testResult && (
                <div className={`flex items-center gap-2 p-3 rounded-md ${
                  testResult.valid ? 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100' : 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100'
                }`}>
                  {testResult.valid ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm">{testResult.message}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm">{testResult.message}</span>
                    </>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={testPath}
                  disabled={!selectedPath || testing}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  {testing ? 'Testing...' : 'Test Path'}
                </Button>
                <Button
                  onClick={savePath}
                  disabled={!selectedPath || (testResult !== null && !testResult.valid)}
                >
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
