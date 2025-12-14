import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import type { Conversation } from '~/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MonacoCodeBlock } from './MonacoCodeBlock';
import { formatNumber, formatModelName } from '~/lib/stats';

interface ConversationViewerProps {
  conversation: Conversation;
  onBack: () => void;
}

export function ConversationViewer({ conversation, onBack }: ConversationViewerProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold">Conversation Details</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap ml-12">
          <span className="text-sm text-muted-foreground">
            {format(conversation.timestamp, 'MMM dd, yyyy HH:mm')}
          </span>
          <span className="text-muted-foreground">•</span>
          <Badge variant="outline">{conversation.messageCount} messages</Badge>
          {conversation.model && (
            <>
              <span className="text-muted-foreground">•</span>
              <Badge>{formatModelName(conversation.model)}</Badge>
            </>
          )}
          {conversation.totalTokens && (
            <>
              <span className="text-muted-foreground">•</span>
              <Badge variant="secondary">{formatNumber(conversation.totalTokens)} tokens</Badge>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="formatted" className="flex-1 flex flex-col min-h-0">
        <div className="border-b px-4">
          <TabsList>
            <TabsTrigger value="formatted">Conversation</TabsTrigger>
            <TabsTrigger value="raw">Raw JSON</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="formatted" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="divide-y divide-border">
              {conversation.messages.map(msg => (
                <ChatMessage key={msg.uuid} message={msg} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="raw" className="flex-1 min-h-0 mt-0 overflow-hidden">
          <div className="h-full p-6">
            <MonacoCodeBlock
              code={JSON.stringify(conversation, null, 2)}
              language="json"
              maxHeight={9999}
            />
          </div>
        </TabsContent>

        <TabsContent value="stats" className="flex-1 min-h-0 mt-0 p-6">
          <ScrollArea className="h-full">
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Total Messages</div>
                  <div className="text-2xl font-bold">{conversation.messageCount}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">User Messages</div>
                  <div className="text-2xl font-bold">
                    {conversation.messages.filter(m => m.type === 'user').length}
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Assistant Messages</div>
                  <div className="text-2xl font-bold">
                    {conversation.messages.filter(m => m.type === 'assistant').length}
                  </div>
                </div>
                {conversation.totalTokens && (
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Total Tokens</div>
                    <div className="text-2xl font-bold">
                      {formatNumber(conversation.totalTokens)}
                    </div>
                  </div>
                )}
                {conversation.inputTokens && (
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Input Tokens</div>
                    <div className="text-2xl font-bold">
                      {formatNumber(conversation.inputTokens)}
                    </div>
                  </div>
                )}
                {conversation.outputTokens && (
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Output Tokens</div>
                    <div className="text-2xl font-bold">
                      {formatNumber(conversation.outputTokens)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
