import { Link } from 'react-router';
import { format } from 'date-fns';
import { FolderOpen, Calendar } from 'lucide-react';
import type { Project } from '~/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface ProjectCardProps {
  project: Project;
  onClick?: (project: Project) => void;
  isSelected?: boolean;
}

export function ProjectCard({ project, onClick, isSelected }: ProjectCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(project);
    }
  };

  return (
    <Link to={`/project/${project.id}`} onClick={handleClick}>
      <Card className={`hover:border-primary transition-colors cursor-pointer ${isSelected ? 'border-primary' : ''}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">{project.displayName}</CardTitle>
            </div>
            <Badge variant="secondary">
              {project.conversationCount} conversations
            </Badge>
          </div>
          <CardDescription className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(project.lastModified, 'MMM dd, yyyy')}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground truncate">
            {project.path}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
