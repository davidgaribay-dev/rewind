import { useRef, useState } from 'react';
import { DiffEditor, type DiffOnMount } from '@monaco-editor/react';
import { useTheme } from '~/hooks/useTheme';
import { Maximize2, Minimize2, X, Download } from 'lucide-react';
import { Button } from './ui/button';

interface MonacoDiffBlockProps {
  original: string;
  modified: string;
  language?: string;
  className?: string;
  maxHeight?: number;
}

/**
 * Monaco Diff Editor wrapper for displaying code changes
 * Shows side-by-side or inline diff view
 */
export function MonacoDiffBlock({
  original,
  modified,
  language = 'plaintext',
  className = '',
  maxHeight = 600,
}: MonacoDiffBlockProps) {
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

  const handleEditorDidMount: DiffOnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Auto-resize to content (only when not in fullscreen)
    const updateHeight = () => {
      if (isFullscreen) {
        // In fullscreen, just layout without height constraints
        editor.layout();
      } else {
        const modifiedEditor = editor.getModifiedEditor();
        const contentHeight = Math.min(
          maxHeight,
          modifiedEditor.getContentHeight()
        );

        // DiffEditor doesn't have getDomNode, but we can use the container element
        const containerElement = modifiedEditor.getContainerDomNode()?.parentElement;
        if (containerElement) {
          containerElement.style.height = `${contentHeight}px`;
        }
        editor.layout();
      }
    };

    // Initial resize
    setTimeout(updateHeight, 100);

    // Update on content changes
    const modifiedEditor = editor.getModifiedEditor();
    modifiedEditor.onDidContentSizeChange(updateHeight);
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

    // Download modified (new) version
    const blob = new Blob([modified], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `code-modified.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const diffEditorContent = (
    <DiffEditor
      height={isFullscreen ? '100%' : `${maxHeight}px`}
      language={getMonacoLanguage(language)}
      original={original}
      modified={modified}
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
        renderSideBySide: true,
        ignoreTrimWhitespace: false,
        enableSplitViewResizing: isFullscreen,
      }}
    />
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Diff Viewer</span>
            {language !== 'plaintext' && (
              <span className="text-xs text-muted-foreground font-mono">({language})</span>
            )}
            <div className="ml-4 flex items-center gap-2 text-xs">
              <span className="text-red-600">- old_string</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-green-600">+ new_string</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-8 w-8 p-0"
              title="Download modified version"
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
          <DiffEditor
            height="100%"
            language={getMonacoLanguage(language)}
            original={original}
            modified={modified}
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
              renderSideBySide: true,
              ignoreTrimWhitespace: false,
              enableSplitViewResizing: true,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`monaco-diff-block rounded-md overflow-hidden border relative group ${className}`}>
      <div className="bg-muted px-3 py-2 text-xs font-medium border-b flex items-center justify-between">
        <div>
          <span className="text-red-600">- old_string</span>
          <span className="mx-2 text-muted-foreground">|</span>
          <span className="text-green-600">+ new_string</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-6 w-6 p-0"
            title="Download modified version"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="h-6 w-6 p-0"
            title="Open in fullscreen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {diffEditorContent}
    </div>
  );
}
