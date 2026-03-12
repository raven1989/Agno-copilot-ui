'use client';

import { analyzeContent, tryParseJson, CONTENT_THRESHOLDS } from '@/lib/utils/content-utils';
import { JsonRenderer } from './JsonValue';
import { CodeRenderer } from './CodeRenderer';
import { TextRenderer } from './TextRenderer';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ContentDetectorProps {
  /** The raw content string to render */
  content: string;
  /** Maximum depth for JSON auto-expand */
  jsonMaxDepth?: number;
  /** Maximum lines before truncation for code/text/markdown */
  maxLines?: number;
  /** Additional class names */
  className?: string;
}

/**
 * Detects content type and routes to the appropriate renderer.
 *
 * Content types handled:
 * - JSON objects/arrays → JsonRenderer (collapsible, color-coded)
 * - Code → CodeRenderer (syntax highlighted)
 * - Markdown → MarkdownRenderer (formatted markdown)
 * - Plain text → TextRenderer (with truncation)
 */
export function ContentDetector({
  content,
  jsonMaxDepth = 2,
  maxLines = 15,
  className = '',
}: ContentDetectorProps) {
  if (!content) {
    return null;
  }

  const info = analyzeContent(content);

  // JSON objects and arrays - use the collapsible JSON renderer
  if (info.type === 'json-object' || info.type === 'json-array') {
    return (
      <div className={className}>
        <JsonRenderer
          value={info.parsed}
          maxExpandDepth={jsonMaxDepth}
        />
      </div>
    );
  }

  // Markdown content - render with proper markdown formatting
  if (info.type === 'markdown') {
    return (
      <MarkdownRenderer
        content={content}
        maxLines={maxLines}
        className={className}
      />
    );
  }

  // Code content - use syntax highlighted renderer
  if (info.type === 'code') {
    return (
      <CodeRenderer
        content={content}
        language={info.language}
        maxLines={maxLines}
        className={className}
      />
    );
  }

  // Plain text - use text renderer with truncation
  return (
    <TextRenderer
      content={content}
      maxLines={maxLines}
      className={className}
    />
  );
}

/**
 * Hook to get content info for custom rendering decisions
 */
export function useContentInfo(content: string) {
  return analyzeContent(content);
}