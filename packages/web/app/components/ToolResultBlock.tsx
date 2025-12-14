import { useState } from 'react';
import { ChevronDown, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MonacoCodeBlock } from './MonacoCodeBlock';
import type { ToolResultBlock as ToolResultBlockType } from '~/lib/types';
import { log } from '~/lib/logger';

interface ToolResultBlockProps {
  block: ToolResultBlockType;
  toolName?: string;
}

// Detect if content has line numbers (from Read tool)
function hasLineNumbers(content: string): boolean {
  const lines = content.split('\n').slice(0, 5); // Check first 5 lines
  return lines.some(line => /^\s*\d+→/.test(line));
}

// Parse content with line numbers and extract code
function parseLineNumberedContent(content: string): { code: string; startLine: number } {
  const lines = content.split('\n');
  const codeLines: string[] = [];
  let startLine = 1;

  lines.forEach((line, idx) => {
    const match = line.match(/^\s*(\d+)→(.*)$/);
    if (match) {
      const lineNum = parseInt(match[1], 10);
      if (idx === 0) startLine = lineNum;
      codeLines.push(match[2]);
    } else {
      codeLines.push(line);
    }
  });

  return { code: codeLines.join('\n'), startLine };
}

// Detect language from file path or content
function detectLanguage(content: string, toolName?: string): string {
  // Check if it's from Read tool with file path
  if (toolName === 'Read') {
    const firstLine = content.split('\n')[0];
    if (firstLine.includes('.tsx')) return 'tsx';
    if (firstLine.includes('.ts')) return 'typescript';
    if (firstLine.includes('.jsx')) return 'jsx';
    if (firstLine.includes('.js')) return 'javascript';
    if (firstLine.includes('.json')) return 'json';
    if (firstLine.includes('.css')) return 'css';
    if (firstLine.includes('.md')) return 'markdown';
    if (firstLine.includes('.py')) return 'python';
    if (firstLine.includes('.rs')) return 'rust';
    if (firstLine.includes('.go')) return 'go';
  }

  // Default for terminal output
  if (toolName === 'Bash') return 'bash';

  return 'text';
}

export function ToolResultBlock({ block, toolName }: ToolResultBlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isError = block.is_error === true;
  const content = block.content;

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch((error) => {
      log.error('Failed to copy tool result to clipboard:', error);
    });
  };

  // Check if content has line numbers
  const hasNumbers = hasLineNumbers(content);
  const isCodeLike = content.includes('\n') || content.length > 100;
  const shouldCollapse = content.length > 150 || content.split('\n').length > 5;

  // Parse content if it has line numbers
  let displayContent = content;
  let startLineNumber = 1;
  let language = 'text';

  if (hasNumbers) {
    const parsed = parseLineNumberedContent(content);
    displayContent = parsed.code;
    startLineNumber = parsed.startLine;
    language = detectLanguage(content, toolName);
  } else {
    language = detectLanguage(content, toolName);
  }

  // Truncate for preview
  const preview = content.length > 150 ? content.slice(0, 150) + '...' : content;

  const renderContent = () => {
    if (isError) {
      return (
        <pre className="text-xs bg-muted/50 p-3 m-3 rounded border overflow-x-auto whitespace-pre-wrap break-words text-red-600">
          <code>{content}</code>
        </pre>
      );
    }

    // Use Monaco Editor for all code content
    if (hasNumbers || language !== 'text' || isCodeLike) {
      return (
        <div className="m-3">
          <MonacoCodeBlock
            code={displayContent}
            language={language}
            maxHeight={500}
          />
        </div>
      );
    }

    // Fallback: Plain text for very short content
    return (
      <pre className="text-xs bg-muted/50 p-3 m-3 rounded border overflow-x-auto whitespace-pre-wrap break-words font-mono">
        <code>{displayContent}</code>
      </pre>
    );
  };

  return (
    <div className="my-2 relative">
      {/* Visual connector line from tool use to result */}
      <div className={`absolute left-5 -top-2 w-0.5 h-4 ${isError ? 'bg-destructive/30' : 'bg-green-500/30'}`} />

      <div className={`border rounded-lg overflow-hidden ${isError ? 'border-destructive/30 bg-destructive/10' : 'border-green-500/20 bg-green-500/10'}`}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex items-start gap-3 px-4 py-3">
            <div className={`flex items-center justify-center h-8 w-8 rounded-lg border flex-shrink-0 ${isError ? 'bg-destructive/20 border-destructive/40' : 'bg-green-500/20 border-green-500/40'}`}>
              {isError ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`font-semibold text-sm ${isError ? 'text-destructive' : 'text-green-600'}`}>
                  {isError ? 'Tool Error' : 'Tool Result'}
                </span>
                <Badge variant={isError ? 'destructive' : 'outline'} className={`text-xs h-5 ${isError ? '' : 'border-green-500/40 bg-green-500/10 text-green-600'}`}>
                  {isError ? 'Failed' : 'Success'}
                </Badge>
                {hasNumbers && language !== 'text' && (
                  <Badge variant="secondary" className="text-xs h-5">
                    {language}
                  </Badge>
                )}
              </div>
              {!shouldCollapse && !isCodeLike && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{preview}</p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 opacity-60 hover:opacity-100"
                onClick={handleCopy}
                title="Copy result"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
              {shouldCollapse && (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
              )}
            </div>
          </div>

          {shouldCollapse ? (
            <CollapsibleContent>
              <div className="border-t border-border/50">
                {renderContent()}
              </div>
            </CollapsibleContent>
          ) : isCodeLike && (
            <div className="border-t border-border/50">
              {renderContent()}
            </div>
          )}
        </Collapsible>
      </div>
    </div>
  );
}
