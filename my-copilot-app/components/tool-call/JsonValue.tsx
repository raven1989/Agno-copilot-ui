'use client';

import { useState, useCallback, useId } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { isObject, isArray, getItemCount } from '@/lib/utils/content-utils';

interface JsonValueProps {
  /** The JSON value to render */
  value: unknown;
  /** Current nesting depth */
  depth?: number;
  /** Maximum depth to auto-expand (deeper levels start collapsed) */
  maxExpandDepth?: number;
  /** Key name for this value (when inside an object) */
  keyName?: string | number;
  /** Whether this is an array item */
  isArrayItem?: boolean;
  /** Index in array (for display) */
  index?: number;
}

// Color classes for different JSON types
const TYPE_COLORS = {
  string: 'text-green-700 bg-green-50',
  number: 'text-blue-700 bg-blue-50',
  boolean: 'text-purple-700 bg-purple-50',
  null: 'text-gray-500 bg-gray-50',
  key: 'text-red-600 font-medium',
} as const;

// Maximum string length before truncation
const MAX_STRING_LENGTH = 100;

/**
 * Get the type of a JSON value for styling purposes
 */
function getValueType(value: unknown): 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array' {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'array';
  return 'object';
}

/**
 * Render a primitive value (string, number, boolean, null)
 */
function PrimitiveValue({ value, type }: { value: unknown; type: 'string' | 'number' | 'boolean' | 'null' }) {
  const [expanded, setExpanded] = useState(false);
  const stringValue = type === 'string' ? (value as string) : null;
  const isTruncated = stringValue !== null && stringValue.length > MAX_STRING_LENGTH;

  let displayValue: string;

  switch (type) {
    case 'string':
      if (isTruncated && !expanded) {
        displayValue = `"${stringValue.slice(0, MAX_STRING_LENGTH)}…"`;
      } else {
        displayValue = `"${value}"`;
      }
      break;
    case 'number':
      displayValue = String(value);
      break;
    case 'boolean':
      displayValue = value ? 'true' : 'false';
      break;
    case 'null':
      displayValue = 'null';
      break;
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setExpanded((prev) => !prev);
    }
  }, []);

  return (
    <span className={`${TYPE_COLORS[type]} px-1 rounded text-sm font-mono`}>
      {displayValue}
      {isTruncated && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          onKeyDown={handleKeyDown}
          className="ml-1.5 px-1.5 py-0.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label={expanded ? 'Show less' : 'Show all'}
        >
          {expanded ? 'show less' : 'show all'}
        </button>
      )}
    </span>
  );
}

/**
 * Render a collapsible section (object or array)
 */
function CollapsibleSection({
  value,
  type,
  depth,
  maxExpandDepth,
  keyName,
  isArrayItem,
  index,
}: {
  value: Record<string, unknown> | unknown[];
  type: 'object' | 'array';
  depth: number;
  maxExpandDepth: number;
  keyName?: string | number;
  isArrayItem?: boolean;
  index?: number;
}) {
  const itemInfo = getItemCount(value);
  const shouldAutoExpand = depth < maxExpandDepth;
  const [expanded, setExpanded] = useState(shouldAutoExpand);

  // Generate unique ID for accessibility
  const generatedId = useId();
  const contentId = `json-content-${generatedId}`;

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleExpand();
    }
    // Allow left/right arrow keys to collapse/expand
    if (e.key === 'ArrowLeft' && expanded) {
      setExpanded(false);
    }
    if (e.key === 'ArrowRight' && !expanded) {
      setExpanded(true);
    }
  }, [toggleExpand, expanded]);

  const entries = isArray(value)
    ? value.map((item, i) => ({ key: i, val: item }))
    : Object.entries(value as Record<string, unknown>).map(([k, v]) => ({ key: k, val: v }));

  const isEmpty = entries.length === 0;
  const openBracket = type === 'array' ? '[' : '{';
  const closeBracket = type === 'array' ? ']' : '}';

  // Render key/label portion
  const renderLabel = () => {
    if (isArrayItem && index !== undefined) {
      return (
        <span className="text-gray-500 text-sm mr-1" aria-label={`Index ${index}`}>
          [{index}]
        </span>
      );
    }
    if (keyName !== undefined) {
      return (
        <>
          <span className={TYPE_COLORS.key}>{keyName}</span>
          <span className="text-gray-400 mr-1" aria-hidden="true">:</span>
        </>
      );
    }
    return null;
  };

  // Empty object/array
  if (isEmpty) {
    return (
      <div className="flex items-center">
        {renderLabel()}
        <span className="text-gray-400 text-sm font-mono" aria-label={`Empty ${type}`}>
          {openBracket}{closeBracket}
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        {renderLabel()}
        <button
          onClick={toggleExpand}
          onKeyDown={handleKeyDown}
          className="flex items-center gap-1 px-1 py-0.5 rounded hover:bg-gray-100 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 tap-target"
          aria-expanded={expanded}
          aria-controls={contentId}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${type}${itemInfo ? ` with ${itemInfo.label}` : ''}`}
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" aria-hidden="true" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" aria-hidden="true" />
          )}
          <span className="text-xs text-gray-500 group-hover:text-gray-700">
            {expanded ? openBracket : `${openBracket}…${closeBracket}`}
          </span>
          {!expanded && itemInfo && (
            <span className="text-xs text-gray-400 ml-1">
              ({itemInfo.label})
            </span>
          )}
        </button>
      </div>

      {expanded && (
        <div
          id={contentId}
          className="ml-4 border-l border-gray-200 pl-2 mt-1 space-y-0.5 animate-slideDown"
          role="group"
          aria-label={`${type} contents`}
        >
          {entries.map(({ key, val }) => (
            <JsonValue
              key={key}
              value={val}
              depth={depth + 1}
              maxExpandDepth={maxExpandDepth}
              keyName={type === 'object' ? key : undefined}
              isArrayItem={type === 'array'}
              index={type === 'array' ? (key as number) : undefined}
            />
          ))}
          <span className="text-gray-400 text-sm font-mono" aria-hidden="true">{closeBracket}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Main JsonValue component - recursively renders any JSON value
 */
export function JsonValue({
  value,
  depth = 0,
  maxExpandDepth = 2,
  keyName,
  isArrayItem = false,
  index,
}: JsonValueProps) {
  const type = getValueType(value);

  // Primitive values
  if (type !== 'object' && type !== 'array') {
    const renderKey = () => {
      if (isArrayItem && index !== undefined) {
        return (
          <span className="text-gray-500 text-sm mr-1" aria-label={`Index ${index}`}>
            [{index}]
          </span>
        );
      }
      if (keyName !== undefined) {
        return (
          <>
            <span className={TYPE_COLORS.key}>{keyName}</span>
            <span className="text-gray-400 mr-1" aria-hidden="true">:</span>
          </>
        );
      }
      return null;
    };

    return (
      <div className="flex items-center flex-wrap">
        {renderKey()}
        <PrimitiveValue value={value} type={type} />
      </div>
    );
  }

  // Objects and arrays
  return (
    <CollapsibleSection
      value={value as Record<string, unknown> | unknown[]}
      type={type}
      depth={depth}
      maxExpandDepth={maxExpandDepth}
      keyName={keyName}
      isArrayItem={isArrayItem}
      index={index}
    />
  );
}

/**
 * Root-level JSON renderer with container styling
 */
interface JsonRendererProps {
  /** The parsed JSON value */
  value: unknown;
  /** Maximum depth to auto-expand */
  maxExpandDepth?: number;
  /** Additional container class names */
  className?: string;
}

export function JsonRenderer({ value, maxExpandDepth = 2, className = '' }: JsonRendererProps) {
  return (
    <div className={`font-mono text-sm ${className}`} role="tree" aria-label="JSON data">
      <JsonValue value={value} depth={0} maxExpandDepth={maxExpandDepth} />
    </div>
  );
}