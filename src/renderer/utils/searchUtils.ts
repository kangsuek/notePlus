/**
 * Search utilities for text search, find and replace functionality
 * Supports case-sensitive, whole-word, and regex searches
 */

export interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  useRegex?: boolean;
}

export interface SearchResult {
  index: number;
  length: number;
  match: string;
}

export interface SearchState {
  query: string;
  options: SearchOptions;
  results: SearchResult[];
  currentIndex: number;
}

/**
 * Escapes special regex characters in a string
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Creates a regex pattern from search query and options
 */
export function createSearchPattern(
  query: string,
  options: SearchOptions = {}
): RegExp | null {
  if (!query) return null;

  try {
    let pattern = query;

    if (!options.useRegex) {
      // Escape special regex characters if not using regex
      pattern = escapeRegex(query);
    }

    if (options.wholeWord) {
      // Add word boundary markers
      pattern = `\\b${pattern}\\b`;
    }

    const flags = options.caseSensitive ? 'g' : 'gi';
    return new RegExp(pattern, flags);
  } catch (error) {
    // Invalid regex pattern
    console.error('Invalid search pattern:', error);
    return null;
  }
}

/**
 * Searches for all occurrences of the query in the text
 */
export function searchText(
  text: string,
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  if (!text || !query) return [];

  const pattern = createSearchPattern(query, options);
  if (!pattern) return [];

  const results: SearchResult[] = [];
  let match: RegExpExecArray | null;

  // Find all matches
  while ((match = pattern.exec(text)) !== null) {
    results.push({
      index: match.index,
      length: match[0].length,
      match: match[0],
    });

    // Prevent infinite loop for zero-length matches
    if (match.index === pattern.lastIndex) {
      pattern.lastIndex++;
    }
  }

  return results;
}

/**
 * Gets the line and column position from a character index
 */
export function getPositionFromIndex(
  text: string,
  index: number
): { line: number; column: number } {
  const textBeforeIndex = text.substring(0, index);
  const lines = textBeforeIndex.split('\n');
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;

  return { line, column };
}

/**
 * Gets the character index from a line and column position
 */
export function getIndexFromPosition(
  text: string,
  line: number,
  column: number
): number {
  const lines = text.split('\n');
  let index = 0;

  for (let i = 0; i < line - 1 && i < lines.length; i++) {
    index += lines[i].length + 1; // +1 for newline character
  }

  index += Math.min(column - 1, lines[line - 1]?.length || 0);
  return index;
}

/**
 * Replaces a single occurrence at the specified index
 */
export function replaceAtIndex(
  text: string,
  index: number,
  length: number,
  replacement: string
): string {
  return text.substring(0, index) + replacement + text.substring(index + length);
}

/**
 * Replaces the current match with the replacement text
 */
export function replaceMatch(
  text: string,
  result: SearchResult,
  replacement: string,
  options: SearchOptions = {}
): { newText: string; newLength: number } {
  let finalReplacement = replacement;

  // Handle regex capture groups if using regex
  if (options.useRegex && result.match) {
    const pattern = createSearchPattern(replacement, { useRegex: false });
    if (pattern) {
      // Replace $1, $2, etc. with captured groups
      finalReplacement = result.match.replace(
        createSearchPattern(replacement, options) || /$^/,
        replacement
      );
    }
  }

  const newText = replaceAtIndex(text, result.index, result.length, finalReplacement);
  return { newText, newLength: finalReplacement.length };
}

/**
 * Replaces all occurrences of the search query
 */
export function replaceAll(
  text: string,
  query: string,
  replacement: string,
  options: SearchOptions = {}
): { newText: string; count: number } {
  if (!text || !query) {
    return { newText: text, count: 0 };
  }

  const results = searchText(text, query, options);
  if (results.length === 0) {
    return { newText: text, count: 0 };
  }

  let newText = text;

  // Replace from end to start to maintain correct indices
  for (let i = results.length - 1; i >= 0; i--) {
    const result = results[i];
    newText = replaceAtIndex(newText, result.index, result.length, replacement);
  }

  return { newText, count: results.length };
}

/**
 * Gets the next search result index (circular)
 */
export function getNextResultIndex(currentIndex: number, totalResults: number): number {
  if (totalResults === 0) return -1;
  return (currentIndex + 1) % totalResults;
}

/**
 * Gets the previous search result index (circular)
 */
export function getPreviousResultIndex(currentIndex: number, totalResults: number): number {
  if (totalResults === 0) return -1;
  return currentIndex === 0 ? totalResults - 1 : currentIndex - 1;
}

/**
 * Validates a regex pattern
 */
export function isValidRegex(pattern: string): boolean {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

/**
 * Highlights search results in text by returning ranges
 */
export function getHighlightRanges(results: SearchResult[]): Array<{
  start: number;
  end: number;
}> {
  return results.map((result) => ({
    start: result.index,
    end: result.index + result.length,
  }));
}
