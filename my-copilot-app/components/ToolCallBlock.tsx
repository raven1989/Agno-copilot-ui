'use client';

import { useState } from 'react';
import {
  Wrench,
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Tool } from '../lib/types';

interface ToolCallBlockProps {
  tool: Tool;
  status: 'running' | 'completed' | 'error';
}

export function ToolCallBlock({ tool, status }: ToolCallBlockProps) {
  const [expanded, setExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
    }
  };

  const getToolColor = () => {
    const colors = [
      'bg-indigo-100 text-indigo-700',
      'bg-pink-100 text-pink-700',
      'bg-cyan-100 text-cyan-700',
      'bg-amber-100 text-amber-700',
      'bg-emerald-100 text-emerald-700',
    ];
    const hash = tool.tool_name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className={`my-3 rounded-lg border overflow-hidden ${getStatusColor()}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-opacity-80 transition-colors"
      >
        <Wrench className="w-4 h-4 text-gray-500" />
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getToolColor()}`}>
          {tool.tool_name}
        </span>
        {getStatusIcon()}
        {expanded ? (
          <ChevronDown className="w-4 h-4 ml-auto" />
        ) : (
          <ChevronRight className="w-4 h-4 ml-auto" />
        )}
      </button>
      {expanded && (
        <div className="px-4 py-3 border-t border-current border-opacity-20 animate-fadeIn">
          {Object.keys(tool.tool_args).length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-500 mb-1">Arguments</div>
              <pre className="text-xs bg-white bg-opacity-60 p-2 rounded overflow-x-auto">
                {JSON.stringify(tool.tool_args, null, 2)}
              </pre>
            </div>
          )}
          {tool.result && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Result</div>
              <pre className="text-xs bg-white bg-opacity-60 p-2 rounded overflow-x-auto max-h-64 overflow-y-auto">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(tool.result), null, 2);
                  } catch {
                    return tool.result;
                  }
                })()}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
