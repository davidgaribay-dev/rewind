import { FileText, FolderOpen, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface HeaderProps {
  onOpenFolder: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  hasProjects?: boolean;
}

export function Header({ onOpenFolder, onRefresh, isLoading, hasProjects }: HeaderProps) {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <FileText className="h-6 w-6" />
          <h1 className="text-xl font-bold">Claude Projects Viewer</h1>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          {hasProjects && onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
          <Button onClick={onOpenFolder} disabled={isLoading}>
            <FolderOpen className="mr-2 h-4 w-4" />
            Open Folder
          </Button>
        </div>
      </div>
    </div>
  );
}
