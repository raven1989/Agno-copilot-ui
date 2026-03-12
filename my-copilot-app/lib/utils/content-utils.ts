/**
 * Content detection and formatting utilities for tool call output rendering.
 */

export type ContentType =
  | 'json-object'
  | 'json-array'
  | 'code'
  | 'markdown'
  | 'text'
  | 'error';

export interface ContentInfo {
  type: ContentType;
  parsed?: unknown;
  language?: string;
  size: number;
  lineCount: number;
  isTruncatable: boolean;
}

// Thresholds for content size handling
export const CONTENT_THRESHOLDS = {
  SHORT: 200,      // Show fully expanded
  MEDIUM: 500,     // Show preview with "show more"
  LONG: 5000,      // Show truncated + "view full" option
  VERY_LONG: 50000, // Use virtualized rendering or modal
} as const;

// Code language detection patterns
const LANGUAGE_PATTERNS: Record<string, RegExp> = {
  python: /^(def |import |from |class |if __name__|print\(|#\s)/m,
  javascript: /^(const |let |var |function |import |export |=>|async |await )/m,
  typescript: /^(interface |type |enum |namespace |import type|export type)/m,
  json: /^[\s]*[{[]/,
  bash: /^(#!\/|\$\(|&&|\|\||echo |cd |ls |grep )/,
  sql: /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/i,
  html: /^[\s]*<(?:!DOCTYPE|html|head|body|div|span|p|a|script|style)/i,
  css: /^[\s]*(@import|@media|@keyframes|[.#]?[\w-]+\s*[{:])/m,
  yaml: /^[\s]*[\w-]+:\s/m,
  xml: /^[\s]*<\?xml|<[\w-]+[\s>]/,
};

// Markdown detection patterns
const MARKDOWN_PATTERNS = [
  /^#{1,6}\s/m,           // Headers
  /\*\*.*?\*\*/,          // Bold
  /\*.*?\*/,              // Italic
  /`[^`]+`/,              // Inline code
  /```[\s\S]*?```/,       // Code blocks
  /^\s*[-*+]\s/m,         // Unordered lists
  /^\s*\d+\.\s/m,         // Ordered lists
  /\[.*?\]\(.*?\)/,       // Links
  /^\s*>/m,               // Blockquotes
];

/**
 * Safely parse JSON string, returning null if invalid
 */
export function tryParseJson(content: string): unknown | null {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Check if a value is a plain object (not array, not null)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if a value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Detect the programming language of code content
 */
export function detectLanguage(content: string): string | undefined {
  for (const [language, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
    if (pattern.test(content)) {
      return language;
    }
  }
  return undefined;
}

/**
 * Check if content looks like markdown
 */
export function isMarkdown(content: string): boolean {
  // Need at least 2 markdown patterns to avoid false positives
  let matchCount = 0;
  for (const pattern of MARKDOWN_PATTERNS) {
    if (pattern.test(content)) {
      matchCount++;
      if (matchCount >= 2) return true;
    }
  }
  return false;
}

/**
 * Check if content looks like code (but not JSON)
 */
export function isCode(content: string, parsed: unknown | null): boolean {
  // If it's valid JSON, treat as JSON not code
  if (parsed !== null) return false;

  // Check for common code indicators
  const codeIndicators = [
    /;\s*$/m,              // Statement terminators
    /{\s*$/m,              // Block starts
    /^\s*\/\//m,           // Single-line comments
    /^\s*\/\*/m,           // Multi-line comments
    /^\s*#/m,              // Hash comments (Python, bash)
    /\bfunction\b/i,       // Function keyword
    /\bclass\b/i,          // Class keyword
    /\bimport\b/i,         // Import keyword
    /\bexport\b/i,         // Export keyword
    /\breturn\b/i,         // Return keyword
    /\bif\s*\(/i,          // If statements
    /\bfor\s*\(/i,         // For loops
    /\bwhile\s*\(/i,       // While loops
  ];

  // Need at least 2 indicators to classify as code
  let indicatorCount = 0;
  for (const pattern of codeIndicators) {
    if (pattern.test(content)) {
      indicatorCount++;
      if (indicatorCount >= 2) return true;
    }
  }
  return false;
}

/**
 * Count lines in content
 */
export function countLines(content: string): number {
  if (!content) return 0;
  return content.split('\n').length;
}

/**
 * Get human-readable size string
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Truncate content to a maximum length with ellipsis
 */
export function truncateContent(content: string, maxLength: number): {
  truncated: string;
  wasTruncated: boolean;
  originalLength: number;
} {
  if (content.length <= maxLength) {
    return {
      truncated: content,
      wasTruncated: false,
      originalLength: content.length,
    };
  }

  return {
    truncated: content.slice(0, maxLength) + '...',
    wasTruncated: true,
    originalLength: content.length,
  };
}

/**
 * Get preview lines from content
 */
export function getPreviewLines(content: string, lineLimit: number): {
  preview: string;
  remainingLines: number;
  totalLines: number;
} {
  const lines = content.split('\n');
  const totalLines = lines.length;

  if (totalLines <= lineLimit) {
    return {
      preview: content,
      remainingLines: 0,
      totalLines,
    };
  }

  return {
    preview: lines.slice(0, lineLimit).join('\n'),
    remainingLines: totalLines - lineLimit,
    totalLines,
  };
}

/**
 * Analyze content and return metadata for rendering decisions
 */
export function analyzeContent(content: string): ContentInfo {
  const size = content.length;
  const lineCount = countLines(content);
  const parsed = tryParseJson(content);

  let type: ContentType;
  let language: string | undefined;

  // Determine content type
  if (parsed !== null) {
    if (isObject(parsed)) {
      type = 'json-object';
    } else if (isArray(parsed)) {
      type = 'json-array';
    } else {
      // Parsed to a primitive (string, number, bool, null)
      type = 'text';
    }
  } else if (isMarkdown(content)) {
    type = 'markdown';
  } else if (isCode(content, parsed)) {
    type = 'code';
    language = detectLanguage(content);
  } else {
    type = 'text';
  }

  // Determine if content should be truncatable
  const isTruncatable = size > CONTENT_THRESHOLDS.SHORT;

  return {
    type,
    parsed,
    language,
    size,
    lineCount,
    isTruncatable,
  };
}

/**
 * Get item count summary for JSON arrays/objects
 */
export function getItemCount(value: unknown): { label: string; count: number } | null {
  if (isObject(value)) {
    const keys = Object.keys(value);
    return {
      label: keys.length === 1 ? '1 key' : `${keys.length} keys`,
      count: keys.length,
    };
  }
  if (isArray(value)) {
    return {
      label: value.length === 1 ? '1 item' : `${value.length} items`,
      count: value.length,
    };
  }
  return null;
}

/**
 * Estimate the "depth" of a JSON structure for collapse decisions
 */
export function estimateDepth(value: unknown, currentDepth = 0): number {
  if (currentDepth > 10) return currentDepth; // Prevent infinite recursion

  if (isObject(value)) {
    const childDepths = Object.values(value).map(v => estimateDepth(v, currentDepth + 1));
    return Math.max(currentDepth, ...childDepths);
  }
  if (isArray(value)) {
    if (value.length === 0) return currentDepth;
    const childDepths = value.map(v => estimateDepth(v, currentDepth + 1));
    return Math.max(currentDepth, ...childDepths);
  }
  return currentDepth;
}

/**
 * Check if a JSON value is "simple" (doesn't need collapsing)
 */
export function isSimpleValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'object') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (isObject(value) && Object.keys(value).length === 0) return true;
  return false;
}