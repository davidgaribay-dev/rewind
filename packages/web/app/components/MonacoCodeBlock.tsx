import { useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useTheme } from '~/hooks/useTheme';
import { Maximize2, Minimize2, X, Download } from 'lucide-react';
import { Button } from './ui/button';

interface MonacoCodeBlockProps {
  code: string;
  language?: string;
  className?: string;
  maxHeight?: number;
}

/**
 * Monaco Editor wrapper for displaying code blocks
 * Automatically detects system theme and provides proper syntax highlighting
 */
export function MonacoCodeBlock({
  code,
  language = 'plaintext',
  className = '',
  maxHeight = 400,
}: MonacoCodeBlockProps) {
  const theme = useTheme();
  const editorRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Map common language aliases to Monaco language identifiers
  const getMonacoLanguage = (lang: string): string => {
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'rb': 'ruby',
      'sh': 'shell',
      'bash': 'shell',
      'yml': 'yaml',
      'jsonl': 'json',
      'md': 'markdown',
    };
    return langMap[lang.toLowerCase()] || lang.toLowerCase();
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Auto-resize to content (only when not in fullscreen)
    const updateHeight = () => {
      if (isFullscreen) {
        // In fullscreen, just layout without height constraints
        editor.layout();
      } else {
        const contentHeight = Math.min(
          maxHeight,
          editor.getContentHeight()
        );
        const container = editor.getDomNode();
        if (container) {
          container.style.height = `${contentHeight}px`;
        }
        editor.layout();
      }
    };

    // Initial resize
    updateHeight();

    // Update on content changes
    editor.onDidContentSizeChange(updateHeight);
  };

  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs';

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = () => {
    // Detect file extension from language
    const extensionMap: Record<string, string> = {
      'javascript': 'js',
      'typescript': 'ts',
      'jsx': 'jsx',
      'tsx': 'tsx',
      'python': 'py',
      'ruby': 'rb',
      'shell': 'sh',
      'bash': 'sh',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'markdown': 'md',
      'css': 'css',
      'html': 'html',
      'rust': 'rs',
      'go': 'go',
    };

    const extension = extensionMap[language] || 'txt';
    const filename = `code.${extension}`;

    // Create blob and download
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const editorContent = (
    <Editor
      height={isFullscreen ? '100%' : `${maxHeight}px`}
      language={getMonacoLanguage(language)}
      value={code}
      theme={monacoTheme}
      onMount={handleEditorDidMount}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 13,
        lineNumbers: 'on',
        renderLineHighlight: 'none',
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto',
          useShadows: false,
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
        wordWrap: 'on',
        wrappingStrategy: 'advanced',
        padding: { top: 8, bottom: 8 },
        contextmenu: false,
        folding: true,
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 3,
      }}
    />
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Code Viewer</span>
            {language !== 'plaintext' && (
              <span className="text-xs text-muted-foreground font-mono">({language})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-8 w-8 p-0"
              title="Download code"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="h-8 w-8 p-0"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            language={getMonacoLanguage(language)}
            value={code}
            theme={monacoTheme}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 13,
              lineNumbers: 'on',
              renderLineHighlight: 'none',
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
                useShadows: false,
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
              },
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              overviewRulerBorder: false,
              wordWrap: 'on',
              wrappingStrategy: 'advanced',
              padding: { top: 8, bottom: 8 },
              contextmenu: false,
              folding: true,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 3,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`monaco-code-block rounded-md overflow-hidden border relative group ${className}`}>
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="h-7 w-7 p-0 bg-background/80 hover:bg-background"
          title="Download code"
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleFullscreen}
          className="h-7 w-7 p-0 bg-background/80 hover:bg-background"
          title="Open in fullscreen"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      {editorContent}
    </div>
  );
}
