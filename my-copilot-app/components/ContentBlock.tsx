'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ContentBlockProps {
  content: string;
}

export function ContentBlock({ content }: ContentBlockProps) {
  if (!content) return null;

  return (
    <div className="prose prose-sm max-w-none prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-code:text-pink-600 prose-headings:font-semibold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
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
                className="rounded-lg text-sm"
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
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-gray-300">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border border-gray-300 px-4 py-2 bg-gray-50 font-semibold text-left">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border border-gray-300 px-4 py-2">
                {children}
              </td>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
