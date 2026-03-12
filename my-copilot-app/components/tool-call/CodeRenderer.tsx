'use client';

import { useState, useCallback, useId } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { detectLanguage, getPreviewLines } from '@/lib/utils/content-utils';

interface CodeRendererProps {
  /** The code content to render */
  content: string;
  /** Optional language hint (will be auto-detected if not provided) */
  language?: string;
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
  /** Maximum lines to show before truncating */
  maxLines?: number;
  /** Additional class names */
  className?: string;
}

/**
 * Renders code content with syntax highlighting, copy button, and smart truncation
 */
export function CodeRenderer({
  content,
  language,
  showLineNumbers = false,
  maxLines = 20,
  className = '',
}: CodeRendererProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Generate unique ID for accessibility
  const generatedId = useId();
  const codeId = `code-${generatedId}`;

  const detectedLanguage = language || detectLanguage(content) || 'text';

  const { preview, remainingLines, totalLines } = getPreviewLines(content, maxLines);
  const shouldTruncate = totalLines > maxLines && !expanded;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [content]);

  const handleExpand = useCallback(() => {
    setExpanded(true);
  }, []);

  const handleCollapse = useCallback(() => {
    setExpanded(false);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  }, []);

  return (
    <div
      className={`relative rounded-lg border border-gray-200 bg-gray-50 ${className}`}
      role="figure"
      aria-label={`${detectedLanguage} code block`}
    >
      {/* Header with language badge and copy button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-100 rounded-t-lg">
        <span className="text-xs font-medium text-gray-600 uppercase" aria-label="Programming language">
          {detectedLanguage}
        </span>
        <button
          onClick={handleCopy}
          onKeyDown={(e) => handleKeyDown(e, handleCopy)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 tap-target"
          title="Copy code"
          aria-label={copied ? 'Copied to clipboard' : 'Copy code to clipboard'}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-600" aria-hidden="true" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto scrollbar-thin" id={codeId}>
        <SyntaxHighlighter
          language={detectedLanguage}
          style={oneLight}
          showLineNumbers={showLineNumbers}
          wrapLines={true}
          customStyle={{
            margin: 0,
            padding: '0.75rem',
            background: 'transparent',
            fontSize: '0.8125rem',
          }}
          lineNumberStyle={{
            minWidth: '2.5em',
            paddingRight: '1em',
            color: '#9ca3af',
            textAlign: 'right',
          }}
        >
          {shouldTruncate ? preview : content}
        </SyntaxHighlighter>
      </div>

      {/* Expand/Collapse controls */}
      {totalLines > maxLines && (
        <div className="flex items-center justify-center py-2 border-t border-gray-200 bg-gray-100 rounded-b-lg">
          {shouldTruncate ? (
            <button
              onClick={handleExpand}
              onKeyDown={(e) => handleKeyDown(e, handleExpand)}
              className="flex items-center gap-1 px-3 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 tap-target"
              aria-expanded="false"
              aria-controls={codeId}
            >
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Show {remainingLines} more lines</span>
              <span className="text-gray-400">({totalLines} total)</span>
            </button>
          ) : (
            <button
              onClick={handleCollapse}
              onKeyDown={(e) => handleKeyDown(e, handleCollapse)}
              className="flex items-center gap-1 px-3 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 tap-target"
              aria-expanded="true"
              aria-controls={codeId}
            >
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Show less</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}