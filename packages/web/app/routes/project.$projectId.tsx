import { useParams, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import type { Route } from './+types/project.$projectId';
import type { Conversation } from '@rewind/shared';
import { useProjects } from '~/hooks/useProjects';
import { getConversationsByProjectId } from '~/lib/api-client';
import { Navbar } from '~/components/Navbar';
import { ConversationDataTable } from '~/components/conversations/data-table';
import { columns } from '~/components/conversations/columns';
import { Button } from '~/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { StatsDashboard } from '~/components/StatsDashboard';
import { calculateStats } from '~/lib/stats';

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Project - Claude Projects Viewer` },
    { name: 'description', content: 'View project conversations' },
  ];
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, loading, refreshProjects } = useProjects();

  const project = projects.find((p) => p.id === projectId);

  // Fetch conversations for this project
  const {
    data: conversationsData = [],
    isLoading: conversationsLoading,
    refetch: refreshConversations,
  } = useQuery({
    queryKey: ['conversations', projectId],
    queryFn: () => getConversationsByProjectId(projectId!),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });

  if (loading || conversationsLoading) {
    return (
      <div className="h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Project not found</h2>
            <p className="text-muted-foreground mb-4">
              The project you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate('/')}>
              Back to Projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Transform API conversations to match the expected format
  const conversations = conversationsData.map(conv => ({
    uuid: conv.id,
    sessionId: conv.id,
    timestamp: new Date(conv.createdAt),
    messageCount: conv.messageCount || 0,
    preview: conv.title || 'Untitled',
    type: 'user' as const,
    messages: [],
  }));

  const handleSelectConversation = (conversation: Conversation) => {
    navigate(`/project/${projectId}/conversation/${conversation.uuid}`);
  };

  const handleRefresh = async () => {
    await Promise.all([refreshProjects(), refreshConversations()]);
  };

  return (
    <div className="h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">{project.displayName}</h1>
              <p className="text-muted-foreground mt-1">
                {project.conversationCount} conversations
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={loading || conversationsLoading}
            >
              <RefreshCw className={`h-4 w-4 ${loading || conversationsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <Tabs defaultValue="conversations" className="space-y-4">
            <TabsList>
              <TabsTrigger value="conversations">Conversations</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="conversations">
              {conversations.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">No conversations found</p>
                </div>
              ) : (
                <ConversationDataTable
                  columns={columns}
                  data={conversations}
                  onSelectConversation={handleSelectConversation}
                />
              )}
            </TabsContent>

            <TabsContent value="stats">
              <StatsDashboard stats={calculateStats([{
                ...project,
                conversations,
              }])} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
