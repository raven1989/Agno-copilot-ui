'use client';

import { useState, useCallback, useId, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { getPreviewLines, formatSize } from '@/lib/utils/content-utils';

interface MarkdownRendererProps {
  /** The markdown content to render */
  content: string;
  /** Maximum lines to show before truncating */
  maxLines?: number;
  /** Whether to show size indicator */
  showSize?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Renders markdown content with proper formatting, smart truncation, and copy functionality
 */
export function MarkdownRenderer({
  content,
  maxLines = 15,
  showSize = true,
  className = '',
}: MarkdownRendererProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Generate unique ID for accessibility
  const generatedId = useId();
  const contentId = `markdown-${generatedId}`;

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
      aria-label="Markdown content"
    >
      {/* Header with label and copy button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Markdown</span>
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
          title="Copy markdown"
          aria-label={copied ? 'Copied to clipboard' : 'Copy markdown to clipboard'}
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

      {/* Markdown content */}
      <div id={contentId} className="p-3 scrollbar-thin">
        <div className="prose prose-sm max-w-none prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-code:text-pink-600 prose-headings:font-semibold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-p:my-1.5 prose-headings:my-2">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const isInline = !match;

                if (isInline) {
                  return (
                    <code className="px-1.5 py-0.5 rounded bg-gray-100 text-pink-600 text-sm font-mono" {...props}>
                      {children}
                    </code>
                  );
                }

                return (
                  <SyntaxHighlighter
                    style={oneLight}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-lg text-sm !my-2"
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                );
              },
              pre({ children }) {
                return <>{children}</>;
              },
              table({ children }) {
                return (
                  <div className="overflow-x-auto my-3">
                    <table className="min-w-full border-collapse border border-gray-300">
                      {children}
                    </table>
                  </div>
                );
              },
              th({ children }) {
                return (
                  <th className="border border-gray-300 px-3 py-1.5 bg-gray-50 font-semibold text-left text-sm">
                    {children}
                  </th>
                );
              },
              td({ children }) {
                return (
                  <td className="border border-gray-300 px-3 py-1.5 text-sm">
                    {children}
                  </td>
                );
              },
              h1({ children }) {
                return <h1 className="text-lg font-bold mt-3 mb-2">{children}</h1>;
              },
              h2({ children }) {
                return <h2 className="text-base font-bold mt-2.5 mb-1.5">{children}</h2>;
              },
              h3({ children }) {
                return <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>;
              },
              ul({ children }) {
                return <ul className="list-disc list-outside ml-4 space-y-0.5">{children}</ul>;
              },
              ol({ children }) {
                return <ol className="list-decimal list-outside ml-4 space-y-0.5">{children}</ol>;
              },
              blockquote({ children }) {
                return (
                  <blockquote className="border-l-4 border-gray-300 pl-3 py-1 my-2 bg-gray-50 text-gray-700 italic">
                    {children}
                  </blockquote>
                );
              },
              a({ href, children }) {
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {children}
                  </a>
                );
              },
            }}
          >
            {displayContent}
          </ReactMarkdown>
        </div>
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
              aria-controls={contentId}
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
              aria-controls={contentId}
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