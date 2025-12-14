import { useState } from 'react';
import { ChevronDown, Terminal, FileText, Search, Globe, Code, Wrench, Copy, Check, Pen, FileSearch, Play } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MonacoCodeBlock } from './MonacoCodeBlock';
import { MonacoDiffBlock } from './MonacoDiffBlock';
import type { ToolUseBlock as ToolUseBlockType } from '~/lib/types';

interface ToolUseBlockProps {
  block: ToolUseBlockType;
}

// Map tool names to icons, colors, and metadata
const toolConfig: Record<string, { icon: typeof Terminal; color: string; bgColor: string; label: string; category: string }> = {
  Bash: {
    icon: Terminal,
    color: 'text-green-600',
    bgColor: 'bg-green-500/10 border-green-500/20',
    label: 'Terminal',
    category: 'Execution'
  },
  Read: {
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    label: 'Read File',
    category: 'File System'
  },
  Grep: {
    icon: Search,
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
    label: 'Search Content',
    category: 'Search'
  },
  Glob: {
    icon: FileSearch,
    color: 'text-violet-600',
    bgColor: 'bg-violet-500/10 border-violet-500/20',
    label: 'Find Files',
    category: 'Search'
  },
  Write: {
    icon: Pen,
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10 border-orange-500/20',
    label: 'Write File',
    category: 'File System'
  },
  Edit: {
    icon: Code,
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
    label: 'Edit File',
    category: 'File System'
  },
  WebFetch: {
    icon: Globe,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-500/10 border-cyan-500/20',
    label: 'Fetch Web Content',
    category: 'Web'
  },
  WebSearch: {
    icon: Search,
    color: 'text-sky-600',
    bgColor: 'bg-sky-500/10 border-sky-500/20',
    label: 'Search Web',
    category: 'Web'
  },
  Task: {
    icon: Play,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-500/10 border-indigo-500/20',
    label: 'Execute Task',
    category: 'Agent'
  },
};

export function ToolUseBlock({ block }: ToolUseBlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const config = toolConfig[block.name] || {
    icon: Wrench,
    color: 'text-foreground',
    bgColor: 'bg-muted border-border',
    label: block.name,
    category: 'Tool'
  };
  const Icon = config.icon;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(block.input, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract description if available
  const description = block.input.description as string | undefined;
  const otherInputs = { ...block.input };
  if (description) {
    delete otherInputs.description;
  }

  // Get primary parameter for quick view
  const primaryParam = Object.entries(otherInputs)[0];

  return (
    <div className={`my-2 border rounded-lg overflow-hidden ${config.bgColor}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-start gap-3 px-4 py-3">
          <div className={`flex items-center justify-center h-8 w-8 rounded-lg bg-background border flex-shrink-0 ${config.color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`font-semibold text-sm ${config.color}`}>{config.label}</span>
              <Badge variant="outline" className="text-xs font-mono h-5">
                {block.name}
              </Badge>
              <Badge variant="secondary" className="text-xs h-5">
                {config.category}
              </Badge>
            </div>
            {description && (
              <p className="text-xs text-foreground/80 mb-2 leading-relaxed">{description}</p>
            )}
            {!isOpen && primaryParam && (
              <div className="text-xs text-muted-foreground font-mono truncate">
                <span className="font-semibold">{primaryParam[0]}:</span>{' '}
                {typeof primaryParam[1] === 'string'
                  ? primaryParam[1].length > 60
                    ? primaryParam[1].slice(0, 60) + '...'
                    : primaryParam[1]
                  : JSON.stringify(primaryParam[1]).slice(0, 60)}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 opacity-60 hover:opacity-100"
              onClick={handleCopy}
              title="Copy parameters"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-4 pb-3 pt-1">
            <div className="space-y-2.5 pl-11">
              {/* Special case: Edit tool with old_string and new_string - show diff view */}
              {block.name === 'Edit' && 'old_string' in otherInputs && 'new_string' in otherInputs ? (
                <>
                  {/* Show file_path if present */}
                  {'file_path' in otherInputs && (
                    <div className="space-y-1 mb-3">
                      <div className="text-xs font-semibold text-foreground/70">file_path</div>
                      <div className="text-xs font-mono bg-muted/50 p-2 rounded border">
                        {String(otherInputs.file_path)}
                      </div>
                    </div>
                  )}

                  {/* Detect language from file_path */}
                  {(() => {
                    const filePath = String(otherInputs.file_path || '');
                    let language = 'plaintext';

                    if (filePath.endsWith('.tsx')) language = 'tsx';
                    else if (filePath.endsWith('.ts')) language = 'typescript';
                    else if (filePath.endsWith('.jsx')) language = 'jsx';
                    else if (filePath.endsWith('.js')) language = 'javascript';
                    else if (filePath.endsWith('.json')) language = 'json';
                    else if (filePath.endsWith('.css')) language = 'css';
                    else if (filePath.endsWith('.md')) language = 'markdown';
                    else if (filePath.endsWith('.py')) language = 'python';
                    else if (filePath.endsWith('.rs')) language = 'rust';
                    else if (filePath.endsWith('.go')) language = 'go';

                    return (
                      <MonacoDiffBlock
                        original={String(otherInputs.old_string)}
                        modified={String(otherInputs.new_string)}
                        language={language}
                        maxHeight={500}
                      />
                    );
                  })()}

                  {/* Show any other parameters besides file_path, old_string, new_string */}
                  {Object.entries(otherInputs)
                    .filter(([key]) => !['file_path', 'old_string', 'new_string'].includes(key))
                    .map(([key, value]) => {
                      const isString = typeof value === 'string';
                      const content = isString ? value : JSON.stringify(value, null, 2);
                      const language = isString ? 'plaintext' : 'json';
                      const lineCount = content.trim().split('\n').length;

                      // Use simple code block for short content (3 lines or less)
                      if (lineCount <= 3) {
                        return (
                          <div key={key} className="space-y-1">
                            <div className="text-xs font-semibold text-foreground/70">{key}</div>
                            <pre className="text-xs font-mono bg-muted/50 p-2 rounded border overflow-x-auto">
                              <code>{content}</code>
                            </pre>
                          </div>
                        );
                      }

                      // Use Monaco for longer content
                      const estimatedHeight = Math.min(
                        Math.max(lineCount * 19 + 20, 50),
                        300
                      );

                      return (
                        <div key={key} className="space-y-1">
                          <div className="text-xs font-semibold text-foreground/70">{key}</div>
                          <MonacoCodeBlock
                            code={content}
                            language={language}
                            maxHeight={estimatedHeight}
                          />
                        </div>
                      );
                    })}
                </>
              ) : (
                /* Default view: show all parameters */
                Object.entries(otherInputs).map(([key, value]) => {
                  const isString = typeof value === 'string';
                  const content = isString ? value : JSON.stringify(value, null, 2);
                  const lineCount = content.trim().split('\n').length;

                  // Detect language from file_path for Write tool or content parameter
                  let language = isString ? 'plaintext' : 'json';

                  if (block.name === 'Write' && key === 'content' && 'file_path' in otherInputs) {
                    const filePath = String(otherInputs.file_path || '');
                    if (filePath.endsWith('.tsx')) language = 'tsx';
                    else if (filePath.endsWith('.ts')) language = 'typescript';
                    else if (filePath.endsWith('.jsx')) language = 'jsx';
                    else if (filePath.endsWith('.js')) language = 'javascript';
                    else if (filePath.endsWith('.json')) language = 'json';
                    else if (filePath.endsWith('.css')) language = 'css';
                    else if (filePath.endsWith('.md')) language = 'markdown';
                    else if (filePath.endsWith('.py')) language = 'python';
                    else if (filePath.endsWith('.rs')) language = 'rust';
                    else if (filePath.endsWith('.go')) language = 'go';
                    else if (filePath.endsWith('.html')) language = 'html';
                    else if (filePath.endsWith('.xml')) language = 'xml';
                    else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) language = 'yaml';
                    else if (filePath.endsWith('.sh')) language = 'shell';
                    else if (filePath.endsWith('.sql')) language = 'sql';
                  }

                  // Use simple code block for short content (3 lines or less)
                  if (lineCount <= 3) {
                    return (
                      <div key={key} className="space-y-1">
                        <div className="text-xs font-semibold text-foreground/70">{key}</div>
                        <pre className="text-xs font-mono bg-muted/50 p-2 rounded border overflow-x-auto">
                          <code>{content}</code>
                        </pre>
                      </div>
                    );
                  }

                  // Use Monaco for longer content
                  const estimatedHeight = Math.min(
                    Math.max(lineCount * 19 + 20, 50),
                    300
                  );

                  return (
                    <div key={key} className="space-y-1">
                      <div className="text-xs font-semibold text-foreground/70">{key}</div>
                      <MonacoCodeBlock
                        code={content}
                        language={language}
                        maxHeight={estimatedHeight}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
