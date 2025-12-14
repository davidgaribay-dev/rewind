import { useParams, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import type { Route } from './+types/project.$projectId.conversation.$conversationId';
import { useProjects } from '~/hooks/useProjects';
import { getConversationById } from '~/lib/api-client';
import { Navbar } from '~/components/Navbar';
import { ChatMessage } from '~/components/ChatMessage';
import { MonacoCodeBlock } from '~/components/MonacoCodeBlock';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { ScrollArea } from '~/components/ui/scroll-area';
import { formatNumber, formatModelName } from '~/lib/stats';

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Conversation - Rewind` },
    { name: 'description', content: 'View detailed conversation history with messages, code blocks, thinking processes, and token usage statistics' },
    { name: 'keywords', content: 'Claude Code, conversation, AI chat, code blocks, thinking, tool usage, tokens, Monaco editor' },
  ];
}

export default function ConversationDetail() {
  const { projectId, conversationId } = useParams();
  const navigate = useNavigate();
  const { projects, loading: projectsLoading } = useProjects();

  const project = projects.find((p) => p.id === projectId);

  // Fetch conversation details
  const {
    data: conversationData,
    isLoading: conversationLoading,
  } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversationById(conversationId!),
    enabled: !!conversationId,
    staleTime: 30 * 1000,
  });

  if (projectsLoading || conversationLoading) {
    return (
      <div className="h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!conversationData || !project) {
    return (
      <div className="h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Conversation not found</h2>
            <p className="text-muted-foreground mb-4">
              The conversation you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate(`/project/${projectId}`)}>
              Back to Project
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Transform API data to match expected conversation format
  const transformedMessages = (conversationData.messages || []).map(msg => {
    // Build content blocks from rawContent or contentBlocks
    const contentBlocks = msg.contentBlocks?.map(block => {
      if (block.type === 'text') {
        return { type: 'text' as const, text: block.text || '' };
      } else if (block.type === 'thinking') {
        return { type: 'thinking' as const, thinking: block.thinking || '' };
      } else if (block.type === 'tool_use') {
        return {
          type: 'tool_use' as const,
          id: block.toolUseId || '',
          name: block.toolName || '',
          input: block.toolInput || {},
        };
      } else if (block.type === 'tool_result') {
        return {
          type: 'tool_result' as const,
          tool_use_id: block.toolResultId || '',
          content: block.toolContent || '',
          is_error: block.isError || false,
        };
      }
      return null;
    }).filter(Boolean) || [];

    // Create message object based on role
    const messageObj = msg.role === 'assistant' ? {
      model: msg.model || 'unknown',
      id: msg.messageUuid,
      type: 'assistant',
      role: 'assistant',
      content: contentBlocks.length > 0 ? contentBlocks : msg.content || '',
      stop_reason: msg.stopReason as any,
      stop_sequence: null,
      usage: {
        input_tokens: msg.inputTokens || 0,
        output_tokens: msg.outputTokens || 0,
        cache_creation_input_tokens: msg.cacheCreationTokens,
        cache_read_input_tokens: msg.cacheReadTokens,
      },
    } : {
      role: 'user',
      content: msg.content || '',
    };

    return {
      parentUuid: msg.parentUuid,
      isSidechain: msg.isSidechain,
      userType: msg.userType,
      cwd: msg.cwd,
      sessionId: msg.sessionId,
      version: msg.version,
      gitBranch: msg.gitBranch,
      agentId: msg.agentId,
      type: msg.type as 'user' | 'assistant' | 'queue-operation',
      message: messageObj,
      requestId: msg.requestId,
      uuid: msg.messageUuid,
      timestamp: msg.timestamp,
    };
  });

  const conversation = {
    uuid: conversationData.id,
    sessionId: conversationData.id,
    timestamp: new Date(conversationData.createdAt),
    messageCount: transformedMessages.length,
    preview: conversationData.title || 'Untitled',
    type: 'user' as const,
    messages: transformedMessages,
    model: conversationData.messages?.find(m => m.role === 'assistant')?.model,
    totalTokens: conversationData.messages?.reduce((sum, m) =>
      sum + (m.inputTokens || 0) + (m.outputTokens || 0), 0
    ),
    inputTokens: conversationData.messages?.reduce((sum, m) =>
      sum + (m.inputTokens || 0), 0
    ),
    outputTokens: conversationData.messages?.reduce((sum, m) =>
      sum + (m.outputTokens || 0), 0
    ),
  };

  return (
    <div className="h-screen flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h2 className="text-xl font-bold mb-3">Conversation Details</h2>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="text-sm text-muted-foreground">
              {format(conversation.timestamp, 'MMM dd, yyyy HH:mm')}
            </span>
            {conversation.model && (
              <>
                <span className="text-muted-foreground">•</span>
                <Badge>{formatModelName(conversation.model)}</Badge>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Messages:</span>
              <span className="font-medium">{conversation.messageCount}</span>
              <span className="text-muted-foreground text-xs">
                ({conversation.messages.filter((m) => m.type === 'user').length} user, {conversation.messages.filter((m) => m.type === 'assistant').length} assistant)
              </span>
            </div>
            {conversation.totalTokens && (
              <>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Tokens:</span>
                  <span className="font-medium">{formatNumber(conversation.totalTokens)}</span>
                  {conversation.inputTokens && conversation.outputTokens && (
                    <span className="text-muted-foreground text-xs">
                      ({formatNumber(conversation.inputTokens)} in, {formatNumber(conversation.outputTokens)} out)
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="formatted" className="flex-1 flex flex-col min-h-0">
        <div className="border-b">
          <div className="max-w-7xl mx-auto px-6">
            <TabsList>
              <TabsTrigger value="formatted">Conversation</TabsTrigger>
              <TabsTrigger value="raw">Raw JSON</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="formatted" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="max-w-7xl mx-auto px-6 py-8">
              {conversation.messages.map((msg) => (
                <ChatMessage key={msg.uuid} message={msg} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="raw" className="flex-1 min-h-0 mt-0 overflow-hidden">
          <div className="h-full max-w-7xl mx-auto px-6 py-8">
            <MonacoCodeBlock
              code={JSON.stringify(conversation, null, 2)}
              language="json"
              maxHeight={9999}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
