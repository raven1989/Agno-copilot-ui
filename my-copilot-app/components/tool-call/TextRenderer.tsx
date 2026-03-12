'use client';

import { useState, useCallback, useId } from 'react';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { getPreviewLines, formatSize } from '@/lib/utils/content-utils';

interface TextRendererProps {
  /** The text content to render */
  content: string;
  /** Maximum lines to show before truncating */
  maxLines?: number;
  /** Whether to show size indicator */
  showSize?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Renders plain text with smart truncation and copy functionality
 */
export function TextRenderer({
  content,
  maxLines = 6,
  showSize = true,
  className = '',
}: TextRendererProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Generate unique ID for accessibility
  const generatedId = useId();
  const textId = `text-${generatedId}`;

  const { preview, remainingLines, totalLines } = getPreviewLines(content, maxLines);
  const shouldTruncate = totalLines > maxLines && !expanded;
  const displayContent = shouldTruncate ? preview : content;

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
      className={`relative rounded-lg border border-gray-200 bg-white ${className}`}
      role="region"
      aria-label="Text content"
    >
      {/* Header with size and copy button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Text</span>
          {showSize && (
            <span className="text-xs text-gray-400">
              {formatSize(content.length)} · {totalLines} lines
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          onKeyDown={(e) => handleKeyDown(e, handleCopy)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 tap-target"
          title="Copy text"
          aria-label={copied ? 'Copied to clipboard' : 'Copy text to clipboard'}
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

      {/* Text content */}
      <div className="p-3 scrollbar-thin" id={textId}>
        <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words font-mono">
          {displayContent}
        </pre>
      </div>

      {/* Expand/Collapse controls */}
      {totalLines > maxLines && (
        <div className="flex items-center justify-center py-2 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          {shouldTruncate ? (
            <button
              onClick={handleExpand}
              onKeyDown={(e) => handleKeyDown(e, handleExpand)}
              className="flex items-center gap-1 px-3 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 tap-target"
              aria-expanded="false"
              aria-controls={textId}
            >
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Show {remainingLines} more lines</span>
            </button>
          ) : (
            <button
              onClick={handleCollapse}
              onKeyDown={(e) => handleKeyDown(e, handleCollapse)}
              className="flex items-center gap-1 px-3 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 tap-target"
              aria-expanded="true"
              aria-controls={textId}
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