import { Link, useLocation, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useProjects } from '~/hooks/useProjects';
import { getConversationById } from '~/lib/api-client';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';
import { FileText, FolderOpen, MessageSquare } from 'lucide-react';

export function Breadcrumbs() {
  const location = useLocation();
  const { projectId, conversationId } = useParams();
  const { projects } = useProjects();

  // Get current project
  const project = projectId ? projects.find((p) => p.id === projectId) : null;

  // Fetch conversation data if conversationId is present
  const { data: conversationData } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversationById(conversationId!),
    enabled: !!conversationId,
    staleTime: 30 * 1000,
  });

  // Build conversation object for breadcrumb
  const conversation = conversationData ? {
    uuid: conversationData.id,
    sessionId: conversationData.id,
    preview: conversationData.title || 'Untitled',
  } : null;

  // Build breadcrumb items based on current route
  const breadcrumbs = [];

  // Home breadcrumb
  breadcrumbs.push({
    label: 'Projects',
    href: '/',
    icon: FileText,
    isLast: location.pathname === '/',
  });

  // Project breadcrumb
  if (projectId && project) {
    breadcrumbs.push({
      label: project.displayName,
      href: `/project/${projectId}`,
      icon: FolderOpen,
      isLast: !conversationId,
    });
  }

  // Conversation breadcrumb
  if (conversationId && conversation) {
    // Use preview (first few chars) or sessionId as label
    const conversationLabel = conversation.preview?.slice(0, 50) || conversation.sessionId.slice(0, 8);
    breadcrumbs.push({
      label: conversationLabel,
      href: `/project/${projectId}/conversation/${conversationId}`,
      icon: MessageSquare,
      isLast: true,
    });
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => {
          const Icon = crumb.icon;
          return (
            <div key={crumb.href} className="flex items-center">
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="max-w-[200px] truncate">{crumb.label}</span>
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.href} className="flex items-center gap-1.5 hover:opacity-80">
                      <Icon className="h-3.5 w-3.5" />
                      <span className="max-w-[200px] truncate">{crumb.label}</span>
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
