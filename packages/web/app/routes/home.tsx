import { useState } from 'react';
import type { Route } from './+types/home';
import { useProjects } from '~/hooks/useProjects';
import { Navbar } from '~/components/Navbar';
import { ProjectCard } from '~/components/ProjectCard';
import { ProjectDataTable } from '~/components/projects/data-table';
import { projectColumns } from '~/components/projects/columns';
import { Button } from '~/components/ui/button';
import { RefreshCw, LayoutGrid, Table, Database } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group';
import { ETLLogViewer } from '~/components/ETLLogViewer';
import { useToast } from '~/hooks/use-toast';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Claude Projects Viewer' },
    { name: 'description', content: 'Browse and visualize your Claude Code conversation history' },
  ];
}

export default function Home() {
  const { projects, loading, refreshProjects, hasProjects } = useProjects();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [showETLLogs, setShowETLLogs] = useState(false);
  const { toast } = useToast();

  const handleRunETL = () => {
    setShowETLLogs(true);
  };

  const handleETLComplete = () => {
    toast({
      title: 'Import Complete',
      description: 'Your Claude Code conversation history has been successfully imported.',
    });
    refreshProjects();
  };

  return (
    <div className="h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Projects</h1>
              <p className="text-muted-foreground mt-1">
                Browse your Claude Code conversation history ({projects.length} projects)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                onClick={handleRunETL}
              >
                <Database className="h-4 w-4 mr-2" />
                Import Data
              </Button>
              <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'grid' | 'table')}>
                <ToggleGroupItem value="grid" aria-label="Grid view">
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="table" aria-label="Table view">
                  <Table className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
              <Button
                variant="outline"
                size="icon"
                onClick={() => refreshProjects()}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !hasProjects ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <Database className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg mb-2">No projects found</p>
                <p className="text-sm mb-4">Import your Claude Code conversation history to get started</p>
                <Button onClick={handleRunETL}>
                  <Database className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <ProjectDataTable columns={projectColumns} data={projects} />
          )}
        </div>
      </div>

      <ETLLogViewer
        isOpen={showETLLogs}
        onClose={() => setShowETLLogs(false)}
        onComplete={handleETLComplete}
      />
    </div>
  );
}
