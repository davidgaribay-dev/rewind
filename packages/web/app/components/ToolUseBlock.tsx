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
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
    label: 'Terminal',
    category: 'Execution'
  },
  Read: {
    icon: FileText,
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    label: 'Read File',
    category: 'File System'
  },
  Grep: {
    icon: Search,
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
    label: 'Search Content',
    category: 'Search'
  },
  Glob: {
    icon: FileSearch,
    color: 'text-violet-700 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800',
    label: 'Find Files',
    category: 'Search'
  },
  Write: {
    icon: Pen,
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
    label: 'Write File',
    category: 'File System'
  },
  Edit: {
    icon: Code,
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    label: 'Edit File',
    category: 'File System'
  },
  WebFetch: {
    icon: Globe,
    color: 'text-cyan-700 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800',
    label: 'Fetch Web Content',
    category: 'Web'
  },
  WebSearch: {
    icon: Search,
    color: 'text-sky-700 dark:text-sky-400',
    bgColor: 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800',
    label: 'Search Web',
    category: 'Web'
  },
  Task: {
    icon: Play,
    color: 'text-indigo-700 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800',
    label: 'Execute Task',
    category: 'Agent'
  },
};

export function ToolUseBlock({ block }: ToolUseBlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const config = toolConfig[block.name] || {
    icon: Wrench,
    color: 'text-gray-700 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800',
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
          <div className={`flex items-center justify-center h-8 w-8 rounded-lg bg-white dark:bg-gray-900 border flex-shrink-0 ${config.color}`}>
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

                      return (
                        <div key={key} className="space-y-1">
                          <div className="text-xs font-semibold text-foreground/70">{key}</div>
                          <MonacoCodeBlock
                            code={content}
                            language={language}
                            maxHeight={300}
                          />
                        </div>
                      );
                    })}
                </>
              ) : (
                /* Default view: show all parameters with Monaco editors */
                Object.entries(otherInputs).map(([key, value]) => {
                  const isString = typeof value === 'string';
                  const content = isString ? value : JSON.stringify(value, null, 2);
                  const language = isString ? 'plaintext' : 'json';

                  return (
                    <div key={key} className="space-y-1">
                      <div className="text-xs font-semibold text-foreground/70">{key}</div>
                      <MonacoCodeBlock
                        code={content}
                        language={language}
                        maxHeight={300}
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
