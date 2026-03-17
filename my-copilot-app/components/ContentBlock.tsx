'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ContentBlockProps {
  content: string;
}

export function ContentBlock({ content }: ContentBlockProps) {
  if (!content) return null;

  return (
    <div className="text-[15px] leading-relaxed text-gray-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Paragraphs
          p({ children }) {
            return <p className="my-3 last:mb-0">{children}</p>;
          },

          // Headings
          h1({ children }) {
            return <h1 className="text-2xl font-bold mt-6 mb-3 text-gray-900">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-xl font-bold mt-5 mb-2.5 text-gray-900">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-900">{children}</h3>;
          },
          h4({ children }) {
            return <h4 className="text-base font-semibold mt-3 mb-1.5 text-gray-900">{children}</h4>;
          },

          // Lists
          ul({ children }) {
            return <ul className="my-3 ml-5 space-y-1.5 list-disc marker:text-gray-400">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="my-3 ml-5 space-y-1.5 list-decimal marker:text-gray-400">{children}</ol>;
          },
          li({ children }) {
            return <li className="pl-1">{children}</li>;
          },

          // Code block wrapper - detect if this is a code block (has pre parent)
          pre({ children }) {
            return <>{children}</>;
          },

          // Code - both inline and block
          code({ className, children, ...props }) {
            // Check if this is inline code by looking at the content
            // Inline code has no newlines, block code has newlines
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

            // Block code - use syntax highlighter
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : 'text';

            return (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={language}
                PreTag="div"
                className="rounded-xl !my-4 !bg-[#1e1e1e] shadow-sm"
                customStyle={{
                  padding: '16px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  borderRadius: '12px',
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
              <blockquote className="my-4 pl-4 border-l-4 border-slate-300 text-slate-600 italic">
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

          // Horizontal rule
          hr() {
            return <hr className="my-6 border-slate-200" />;
          },

          // Tables - clean minimal style
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto">
                <table className="min-w-full text-sm">
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
              <th className="px-4 py-2.5 text-left font-semibold text-slate-700 whitespace-nowrap">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-4 py-2.5 text-slate-600">
                {children}
              </td>
            );
          },

          // Strong and emphasis
          strong({ children }) {
            return <strong className="font-semibold text-gray-900">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic">{children}</em>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
