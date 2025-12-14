import { format } from 'date-fns';
import { ChevronDown, Copy, Check, User, Bot, Sparkles } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ConversationMessage, ContentBlock, ToolUseBlock as ToolUseBlockType, ToolResultBlock as ToolResultBlockType, TextBlock, ThinkingBlock as ThinkingBlockType, AssistantMessage } from '~/lib/types';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Button } from './ui/button';
import { formatNumber } from '~/lib/stats';
import { ToolUseBlock } from './ToolUseBlock';
import { ToolResultBlock } from './ToolResultBlock';
import { ThinkingBlock } from './ThinkingBlock';
import { MonacoCodeBlock } from './MonacoCodeBlock';
import { log } from '~/lib/logger';

/**
 * Type guard to check if a message is an AssistantMessage
 */
function isAssistantMessage(message: ConversationMessage['message']): message is AssistantMessage {
  return 'model' in message && 'usage' in message;
}

// Code block component with Monaco Editor and copy button
function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace('language-', '') || 'plaintext';

  const handleCopy = () => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch((error) => {
      log.error('Failed to copy code to clipboard:', error);
    });
  };

  // Calculate appropriate height based on content
  const lineCount = children.trim().split('\n').length;
  const maxHeight = Math.min(
    Math.max(lineCount * 19 + 20, 50), // At least 50px, ~19px per line + padding
    600 // Cap at 600px
  );

  return (
    <figure className="relative group/code not-prose my-4">
      <div className="flex items-center justify-between bg-muted/50 px-4 py-2 border-b border-border rounded-t-lg">
        <span className="text-xs text-muted-foreground font-mono">{language}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 opacity-0 group-hover/code:opacity-100 transition-opacity"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              <span className="text-xs">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </Button>
      </div>
      <MonacoCodeBlock
        code={children}
        language={language}
        className="!mt-0 !rounded-t-none"
        maxHeight={maxHeight}
      />
    </figure>
  );
}

interface ChatMessageProps {
  message: ConversationMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.type === 'user';

  // Parse content blocks
  let textContent = '';
  let contentBlocks: ContentBlock[] = [];

  if (typeof message.message.content === 'string') {
    textContent = message.message.content;
  } else if (Array.isArray(message.message.content)) {
    contentBlocks = message.message.content as ContentBlock[];
    const textBlock = contentBlocks.find(c => c.type === 'text') as TextBlock | undefined;
    textContent = textBlock?.text || '';
  }

  // Separate content blocks by type for better organization
  const thinkingBlocks = contentBlocks.filter(b => b.type === 'thinking') as ThinkingBlockType[];
  const toolUseBlocks = contentBlocks.filter(b => b.type === 'tool_use') as ToolUseBlockType[];
  const toolResultBlocks = contentBlocks.filter(b => b.type === 'tool_result') as ToolResultBlockType[];

  // Group tool uses with their results
  const toolPairs = toolUseBlocks.map(toolUse => {
    const result = toolResultBlocks.find(r => r.tool_use_id === toolUse.id);
    return { toolUse, result };
  });

  // Find orphaned tool results (results without a corresponding tool use)
  const orphanedResults = toolResultBlocks.filter(
    result => !toolUseBlocks.some(use => use.id === result.tool_use_id)
  );

  // Get usage and model data if this is an assistant message
  const usage = isAssistantMessage(message.message) ? message.message.usage : null;
  const model = isAssistantMessage(message.message) ? message.message.model : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(textContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch((error) => {
      log.error('Failed to copy message to clipboard:', error);
    });
  };

  if (isUser) {
    // User message: compact, right-aligned design
    return (
      <div className="group py-4 px-6">
        <div className="flex justify-end gap-3">
          <div className="max-w-[85%]">
            {textContent && (
              <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
                <div className="prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-p:my-1 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      pre: ({ children }) => <>{children}</>,
                      code: (props) => {
                        const { inline, className, children } = props as { inline?: boolean; className?: string; children?: React.ReactNode };
                        if (inline) {
                          return (
                            <code className="bg-primary-foreground/20 px-1.5 py-0.5 rounded text-sm font-mono">
                              {children}
                            </code>
                          );
                        }
                        const codeContent = String(children).replace(/\n$/, '');
                        return <CodeBlock className={className}>{codeContent}</CodeBlock>;
                      },
                      a: (props) => (
                        <a className="underline hover:no-underline" target="_blank" rel="noopener noreferrer" {...props} />
                      ),
                    }}
                  >
                    {textContent}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            <div className="flex items-center justify-end gap-2 mt-1.5 text-xs text-muted-foreground">
              <span>{format(new Date(message.timestamp), 'HH:mm')}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Assistant message: full-width, structured design with clear sections
  return (
    <div className="group py-4 px-6 bg-muted/30 border-b border-border/50">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-sm">Assistant</span>
            {model && (
              <Badge variant="outline" className="text-xs h-5 font-normal">
                {model.replace('claude-', '').replace(/-/g, ' ')}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {format(new Date(message.timestamp), 'HH:mm')}
            </span>
            {usage && (
              <Badge variant="secondary" className="text-xs h-5 ml-auto">
                <Sparkles className="h-3 w-3 mr-1" />
                {formatNumber((usage.input_tokens || 0) + (usage.output_tokens || 0))} tokens
              </Badge>
            )}
          </div>

          {/* Thinking blocks (if any) */}
          {thinkingBlocks.length > 0 && (
            <div className="space-y-2 mb-3">
              {thinkingBlocks.map((block, idx) => (
                <ThinkingBlock key={idx} block={block} />
              ))}
            </div>
          )}

          {/* Main text content */}
          {textContent && (
            <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:border-border [&>*:first-child]:mt-0">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  pre: ({ children }) => <>{children}</>,
                  code: (props) => {
                    const { className, children, node, ...rest } = props;
                    const inline = !className && !node?.position;
                    if (inline) {
                      return (
                        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">
                          {children}
                        </code>
                      );
                    }
                    const codeContent = String(children).replace(/\n$/, '');
                    return <CodeBlock className={className}>{codeContent}</CodeBlock>;
                  },
                  a: (props) => (
                    <a className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />
                  ),
                  table: (props) => (
                    <div className="overflow-x-auto my-4">
                      <table className="border-collapse" {...props} />
                    </div>
                  ),
                }}
              >
                {textContent}
              </ReactMarkdown>
            </div>
          )}

          {/* Tool calls and results */}
          {toolPairs.length > 0 && (
            <div className="mt-3 space-y-1">
              {toolPairs.map((pair, idx) => (
                <div key={idx}>
                  <ToolUseBlock block={pair.toolUse} />
                  {pair.result && (
                    <ToolResultBlock block={pair.result} toolName={pair.toolUse.name} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Orphaned results (shouldn't happen, but just in case) */}
          {orphanedResults.length > 0 && (
            <div className="mt-3 space-y-2">
              {orphanedResults.map((result, idx) => (
                <ToolResultBlock key={idx} block={result} />
              ))}
            </div>
          )}

          {/* Footer with token details */}
          {usage && (
            <div className="mt-3">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs opacity-60 hover:opacity-100">
                    <span className="flex items-center gap-1.5">
                      <span>Token breakdown</span>
                      <ChevronDown className="h-3 w-3" />
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <div className="inline-grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-muted/50 p-3 rounded-lg border border-border/50">
                    <div>
                      <div className="text-muted-foreground mb-1">Input</div>
                      <div className="font-mono font-semibold text-sm">{formatNumber(usage.input_tokens)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Output</div>
                      <div className="font-mono font-semibold text-sm">{formatNumber(usage.output_tokens)}</div>
                    </div>
                    {usage.cache_read_input_tokens != null && usage.cache_read_input_tokens > 0 && (
                      <div>
                        <div className="text-muted-foreground mb-1">Cache Read</div>
                        <div className="font-mono font-semibold text-sm">{formatNumber(usage.cache_read_input_tokens)}</div>
                      </div>
                    )}
                    {usage.cache_creation_input_tokens && usage.cache_creation_input_tokens > 0 && (
                      <div>
                        <div className="text-muted-foreground mb-1">Cache Write</div>
                        <div className="font-mono font-semibold text-sm">{formatNumber(usage.cache_creation_input_tokens)}</div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Copy button */}
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  <span>Copy message</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
