'use client';

import { useState } from 'react';
import { Brain, ChevronDown, ChevronRight } from 'lucide-react';

interface ReasoningBlockProps {
  content: string;
  defaultExpanded?: boolean;
}

export function ReasoningBlock({ content, defaultExpanded = false }: ReasoningBlockProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!content) return null;

  return (
    <div className="my-3 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <Brain className="w-4 h-4 text-purple-500" />
        <span>Thinking</span>
        {expanded ? (
          <ChevronDown className="w-4 h-4 ml-auto" />
        ) : (
          <ChevronRight className="w-4 h-4 ml-auto" />
        )}
      </button>
      {expanded && (
        <div className="px-4 py-3 text-sm text-gray-500 border-t border-gray-200 whitespace-pre-wrap animate-fadeIn">
          {content}
        </div>
      )}
    </div>
  );
}
