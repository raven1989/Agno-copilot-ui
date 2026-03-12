'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Wrench,
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  Copy,
  Check,
} from 'lucide-react';
import { Tool } from '../lib/types';
import { JsonRenderer } from './tool-call/JsonValue';
import { ContentDetector } from './tool-call/ContentDetector';
import { getItemCount, tryParseJson } from '../lib/utils/content-utils';

interface ToolCallBlockProps {
  tool: Tool;
  status: 'running' | 'completed' | 'error';
}

export function ToolCallBlock({ tool, status }: ToolCallBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const [argumentsExpanded, setArgumentsExpanded] = useState(true);
  const [resultExpanded, setResultExpanded] = useState(true);
  const [copied, setCopied] = useState<'args' | 'result' | null>(null);
  const [animateContent, setAnimateContent] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const argsButtonRef = useRef<HTMLButtonElement>(null);
  const resultButtonRef = useRef<HTMLButtonElement>(null);

  // Trigger animation when expanded
  useEffect(() => {
    if (expanded) {
      setAnimateContent(true);
    }
  }, [expanded]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" aria-hidden="true" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" aria-hidden="true" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" aria-hidden="true" />;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'running':
        return 'Running';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
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

  const handleCopy = useCallback(async (type: 'args' | 'result', content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const hasArgs = Object.keys(tool.tool_args).length > 0;
  const hasResult = tool.result && tool.result.length > 0;

  // Get info about result for display
  const resultInfo = hasResult ? getItemCount(tryParseJson(tool.result || '')) : null;

  // Generate unique IDs for accessibility
  const toolId = `tool-${tool.tool_call_id}`;
  const argsId = `${toolId}-args`;
  const resultId = `${toolId}-result`;

  return (
    <div
      className={`my-2 rounded-lg border overflow-hidden ${getStatusColor()}`}
      role="region"
      aria-label={`Tool call: ${tool.tool_name}`}
    >
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => handleKeyDown(e, () => setExpanded(!expanded))}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-opacity-80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset tap-target"
        aria-expanded={expanded}
        aria-controls={`${toolId}-content`}
        id={`${toolId}-header`}
      >
        <Wrench className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden="true" />
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getToolColor()}`}>
          {tool.tool_name}
        </span>
        <span className="sr-only">{getStatusLabel()}</span>
        {getStatusIcon()}
        {expanded ? (
          <ChevronDown className="w-4 h-4 ml-auto text-gray-400" aria-hidden="true" />
        ) : (
          <ChevronRight className="w-4 h-4 ml-auto text-gray-400" aria-hidden="true" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div
          ref={contentRef}
          id={`${toolId}-content`}
          role="region"
          aria-labelledby={`${toolId}-header`}
          className={`border-t border-current border-opacity-20 ${animateContent ? 'animate-slideDown' : ''}`}
        >
          {/* Arguments section */}
          {hasArgs && (
            <div className="border-b border-current border-opacity-10">
              <div className="flex items-center justify-between">
                <button
                  ref={argsButtonRef}
                  onClick={() => setArgumentsExpanded(!argumentsExpanded)}
                  onKeyDown={(e) => handleKeyDown(e, () => setArgumentsExpanded(!argumentsExpanded))}
                  className="flex-1 flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-white hover:bg-opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset tap-target"
                  aria-expanded={argumentsExpanded}
                  aria-controls={argsId}
                >
                  {argumentsExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                  )}
                  <span>Arguments</span>
                  <span className="text-gray-400">({Object.keys(tool.tool_args).length})</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy('args', JSON.stringify(tool.tool_args, null, 2));
                  }}
                  onKeyDown={(e) => handleKeyDown(e, () => handleCopy('args', JSON.stringify(tool.tool_args, null, 2)))}
                  className="flex items-center gap-1 px-2 py-1 mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 tap-target"
                  title="Copy arguments"
                  aria-label="Copy arguments to clipboard"
                >
                  {copied === 'args' ? (
                    <>
                      <Check className="w-3 h-3 text-green-600" aria-hidden="true" />
                      <span className="text-green-600 text-xs">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" aria-hidden="true" />
                      <span className="text-xs">Copy</span>
                    </>
                  )}
                </button>
              </div>
              {argumentsExpanded && (
                <div
                  id={argsId}
                  className="px-3 py-2 bg-white bg-opacity-40 scrollbar-thin"
                  role="region"
                  aria-label="Arguments content"
                >
                  <JsonRenderer value={tool.tool_args} maxExpandDepth={2} />
                </div>
              )}
            </div>
          )}

          {/* Result section */}
          {hasResult && (
            <div>
              <div className="flex items-center justify-between">
                <button
                  ref={resultButtonRef}
                  onClick={() => setResultExpanded(!resultExpanded)}
                  onKeyDown={(e) => handleKeyDown(e, () => setResultExpanded(!resultExpanded))}
                  className="flex-1 flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-white hover:bg-opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset tap-target"
                  aria-expanded={resultExpanded}
                  aria-controls={resultId}
                >
                  {resultExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                  )}
                  <span>Result</span>
                  {resultInfo && (
                    <span className="text-gray-400">({resultInfo.label})</span>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy('result', tool.result || '');
                  }}
                  onKeyDown={(e) => handleKeyDown(e, () => handleCopy('result', tool.result || ''))}
                  className="flex items-center gap-1 px-2 py-1 mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 tap-target"
                  title="Copy result"
                  aria-label="Copy result to clipboard"
                >
                  {copied === 'result' ? (
                    <>
                      <Check className="w-3 h-3 text-green-600" aria-hidden="true" />
                      <span className="text-green-600 text-xs">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" aria-hidden="true" />
                      <span className="text-xs">Copy</span>
                    </>
                  )}
                </button>
              </div>
              {resultExpanded && (
                <div
                  id={resultId}
                  className="px-3 py-2 bg-white bg-opacity-40 scrollbar-thin"
                  role="region"
                  aria-label="Result content"
                >
                  <ContentDetector
                    content={tool.result || ''}
                    jsonMaxDepth={2}
                    maxLines={15}
                  />
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {status === 'error' && tool.tool_call_error && (
            <div className="px-3 py-2 bg-red-100 border-t border-red-200" role="alert">
              <div className="flex items-center gap-2 text-sm text-red-700">
                <XCircle className="w-4 h-4" aria-hidden="true" />
                <span>Tool execution failed</span>
              </div>
            </div>
          )}

          {/* Running indicator */}
          {status === 'running' && !hasResult && (
            <div className="px-3 py-2 animate-pulse-subtle" aria-live="polite" aria-busy="true">
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Executing...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}