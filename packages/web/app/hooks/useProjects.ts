import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getAllProjects } from '~/lib/api-client';
import type { Project } from '~/lib/types';

const PROJECTS_QUERY_KEY = ['projects'];

export function useProjects() {
  const {
    data: projects = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: getAllProjects,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Transform API data to match existing Project interface
  // Memoize to prevent unnecessary re-computation on every render
  const transformedProjects: Project[] = useMemo(
    () =>
      projects.map(p => ({
        id: p.id,
        displayName: p.name, // Use name as displayName
        name: p.name,
        path: p.path,
        conversationCount: p.conversationCount,
        totalMessages: p.messageCount,
        lastModified: new Date(p.lastActivity || p.createdAt),
      })),
    [projects]
  );

  return {
    projects: transformedProjects,
    loading: isLoading,
    error: error?.message || null,
    loadProjects: refetch, // For compatibility with existing code
    refreshProjects: refetch,
    hasProjects: transformedProjects.length > 0,
  };
}
