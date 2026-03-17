'use client';

import { useState, useCallback, useId } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
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
      className={`rounded-xl border border-slate-200 bg-white overflow-hidden ${className}`}
      role="region"
      aria-label="Markdown content"
    >
      {/* Header with label and copy button */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Markdown</span>
          {showSize && (
            <span className="text-xs text-slate-400">
              {formatSize(content.length)} · {totalLines} lines
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          onKeyDown={(e) => handleKeyDown(e, handleCopy)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          title="Copy markdown"
          aria-label={copied ? 'Copied to clipboard' : 'Copy markdown to clipboard'}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
              <span className="text-emerald-600">Copied!</span>
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
      <div id={contentId} className="p-4 max-h-[400px] overflow-y-auto scrollbar-thin">
        <div className="text-[14px] leading-relaxed text-slate-700">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Paragraphs
              p({ children }) {
                return <p className="my-2 last:mb-0">{children}</p>;
              },

              // Headings
              h1({ children }) {
                return <h1 className="text-xl font-bold mt-4 mb-2 text-slate-800">{children}</h1>;
              },
              h2({ children }) {
                return <h2 className="text-lg font-bold mt-3 mb-2 text-slate-800">{children}</h2>;
              },
              h3({ children }) {
                return <h3 className="text-base font-semibold mt-3 mb-1.5 text-slate-800">{children}</h3>;
              },

              // Lists
              ul({ children }) {
                return <ul className="my-2 ml-4 space-y-1 list-disc marker:text-slate-400">{children}</ul>;
              },
              ol({ children }) {
                return <ol className="my-2 ml-4 space-y-1 list-decimal marker:text-slate-400">{children}</ol>;
              },
              li({ children }) {
                return <li className="pl-1">{children}</li>;
              },

              // Code block wrapper
              pre({ children }) {
                return <>{children}</>;
              },

              // Code - both inline and block
              code({ className, children, ...props }) {
                const content = String(children);
                const isInline = !content.includes('\n');

                if (isInline) {
                  return (
                    <code
                      className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[13px] font-mono font-medium"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }

                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : 'text';

                return (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={language}
                    PreTag="div"
                    className="rounded-lg !my-3 !bg-[#1e1e1e]"
                    customStyle={{
                      padding: '12px',
                      fontSize: '12px',
                      lineHeight: '1.5',
                      borderRadius: '8px',
                    }}
                    codeTagProps={{
                      style: {
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                      },
                    }}
                  >
                    {content.replace(/\n$/, '')}
                  </SyntaxHighlighter>
                );
              },

              // Blockquote
              blockquote({ children }) {
                return (
                  <blockquote className="my-3 pl-3 border-l-4 border-slate-300 text-slate-500 italic">
                    {children}
                  </blockquote>
                );
              },

              // Links
              a({ href, children }) {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline underline-offset-2"
                  >
                    {children}
                  </a>
                );
              },

              // Tables
              table({ children }) {
                return (
                  <div className="my-3 overflow-x-auto">
                    <table className="min-w-full text-xs">
                      {children}
                    </table>
                  </div>
                );
              },
              thead({ children }) {
                return <thead className="bg-slate-50">{children}</thead>;
              },
              tbody({ children }) {
                return <tbody className="divide-y divide-slate-100">{children}</tbody>;
              },
              th({ children }) {
                return (
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap">
                    {children}
                  </th>
                );
              },
              td({ children }) {
                return (
                  <td className="px-3 py-2 text-slate-600">
                    {children}
                  </td>
                );
              },

              // Strong and emphasis
              strong({ children }) {
                return <strong className="font-semibold text-slate-800">{children}</strong>;
              },
              em({ children }) {
                return <em className="italic">{children}</em>;
              },
            }}
          >
            {displayContent}
          </ReactMarkdown>
        </div>
      </div>

      {/* Expand/Collapse controls */}
      {totalLines > maxLines && (
        <div className="flex items-center justify-center py-2 bg-slate-50 border-t border-slate-200">
          {shouldTruncate ? (
            <button
              onClick={handleExpand}
              onKeyDown={(e) => handleKeyDown(e, handleExpand)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-expanded="false"
              aria-controls={contentId}
            >
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
              <span>Show {remainingLines} more lines</span>
            </button>
          ) : (
            <button
              onClick={handleCollapse}
              onKeyDown={(e) => handleKeyDown(e, handleCollapse)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-expanded="true"
              aria-controls={contentId}
            >
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
              <span>Show less</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}