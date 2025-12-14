import { useState } from 'react';
import { Brain, ChevronDown, Copy, Check } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { ThinkingBlock as ThinkingBlockType } from '~/lib/types';
import { log } from '~/lib/logger';

interface ThinkingBlockProps {
  block: ThinkingBlockType;
}

const THINKING_PREVIEW_LENGTH = 120; // Characters to show in preview
const COPY_FEEDBACK_DURATION_MS = 2000; // Duration to show copy confirmation

export function ThinkingBlock({ block }: ThinkingBlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(block.thinking).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS);
    }).catch((error) => {
      log.error('Failed to copy to clipboard:', error);
    });
  };

  const preview = block.thinking.length > THINKING_PREVIEW_LENGTH
    ? block.thinking.slice(0, THINKING_PREVIEW_LENGTH) + '...'
    : block.thinking;

  return (
    <div className="my-3 border-l-4 border-purple-500 bg-purple-50 rounded-r-lg overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-start gap-3 px-4 py-3">
          <Brain className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm text-purple-900">
                Extended Thinking
              </span>
              <Badge variant="secondary" className="text-xs">
                Reasoning
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              {isOpen ? block.thinking : preview}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
            {block.thinking.length > THINKING_PREVIEW_LENGTH && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
            )}
          </div>
        </div>
      </Collapsible>
    </div>
  );
}
