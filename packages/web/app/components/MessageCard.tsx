import { format } from 'date-fns';
import { User, Bot, ChevronDown } from 'lucide-react';
import type { ConversationMessage, AssistantMessage } from '@rewind/shared';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Button } from './ui/button';
import { formatNumber } from '~/lib/stats';

interface MessageCardProps {
  message: ConversationMessage;
}

export function MessageCard({ message }: MessageCardProps) {
  const isUser = message.type === 'user';
  const isAssistant = message.type === 'assistant';

  // Extract content
  let content = '';
  if (typeof message.message.content === 'string') {
    content = message.message.content;
  } else if (Array.isArray(message.message.content)) {
    const textContent = message.message.content.find(c => c.type === 'text');
    content = textContent?.text || JSON.stringify(message.message.content, null, 2);
  }

  // Get usage data if available (only for assistant messages)
  const usage = 'usage' in message.message ? (message.message as AssistantMessage).usage : null;

  return (
    <Card className={`mb-4 ${isUser ? 'border-l-4 border-l-primary' : 'border-l-4 border-l-secondary'}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarFallback>
              {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-sm">
              {isUser ? 'User' : isAssistant ? 'Assistant' : 'Queue Operation'}
            </CardTitle>
            <CardDescription className="text-xs">
              {format(new Date(message.timestamp), 'MMM dd, yyyy HH:mm:ss')}
            </CardDescription>
          </div>
          {message.type === 'user' && (
            <Badge variant="outline" className="ml-auto">User</Badge>
          )}
          {message.type === 'assistant' && (
            <Badge variant="outline" className="ml-auto">Assistant</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-sm">{content}</pre>
        </div>

        {/* Show usage information if available */}
        {usage && (
          <Collapsible className="mt-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <span className="text-xs font-medium">Token Usage</span>
                  <Badge variant="secondary" className="text-xs">
                    {formatNumber(usage.input_tokens + usage.output_tokens)}
                  </Badge>
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Input:</span>
                  <span className="font-mono">{formatNumber(usage.input_tokens)}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Output:</span>
                  <span className="font-mono">{formatNumber(usage.output_tokens)}</span>
                </div>
                {usage.cache_read_input_tokens != null && usage.cache_read_input_tokens > 0 && (
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">Cache Read:</span>
                    <span className="font-mono">{formatNumber(usage.cache_read_input_tokens)}</span>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
