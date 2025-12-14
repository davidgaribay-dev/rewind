import { useState } from 'react';
import type { Project } from '~/lib/types';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { ProjectCard } from './ProjectCard';

interface SidebarProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
}

export function Sidebar({ projects, selectedProject, onSelectProject }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter(project =>
    project.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-4">Projects</h2>
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {filteredProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No projects found
            </p>
          ) : (
            filteredProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => onSelectProject(project)}
                isSelected={selectedProject?.id === project.id}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
