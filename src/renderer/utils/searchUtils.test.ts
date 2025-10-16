import {
  escapeRegex,
  createSearchPattern,
  searchText,
  getPositionFromIndex,
  getIndexFromPosition,
  replaceAtIndex,
  replaceMatch,
  replaceAll,
  getNextResultIndex,
  getPreviousResultIndex,
  isValidRegex,
  getHighlightRanges,
  type SearchOptions,
  type SearchResult,
} from './searchUtils';

describe('searchUtils', () => {
  describe('escapeRegex', () => {
    it('should escape special regex characters', () => {
      expect(escapeRegex('hello.world')).toBe('hello\\.world');
      expect(escapeRegex('test*pattern')).toBe('test\\*pattern');
      expect(escapeRegex('[abc]+')).toBe('\\[abc\\]\\+');
      expect(escapeRegex('a|b')).toBe('a\\|b');
      expect(escapeRegex('(test)')).toBe('\\(test\\)');
    });

    it('should return the same string if no special characters', () => {
      expect(escapeRegex('hello')).toBe('hello');
      expect(escapeRegex('test123')).toBe('test123');
    });
  });

  describe('createSearchPattern', () => {
    it('should create a case-insensitive pattern by default', () => {
      const pattern = createSearchPattern('hello');
      expect(pattern?.flags).toBe('gi');
      // Reset lastIndex for global regex before each test
      pattern!.lastIndex = 0;
      expect(pattern?.test('Hello')).toBe(true);
      pattern!.lastIndex = 0;
      expect(pattern?.test('HELLO')).toBe(true);
    });

    it('should create a case-sensitive pattern when specified', () => {
      const pattern = createSearchPattern('hello', { caseSensitive: true });
      expect(pattern?.flags).toBe('g');
      expect(pattern?.test('hello')).toBe(true);
      expect(pattern?.test('Hello')).toBe(false);
    });

    it('should create a whole-word pattern when specified', () => {
      const pattern = createSearchPattern('test', { wholeWord: true });
      expect(pattern?.test('test')).toBe(true);
      expect(pattern?.test('testing')).toBe(false);
      expect(pattern?.test('retest')).toBe(false);
    });

    it('should handle regex patterns', () => {
      const pattern = createSearchPattern('\\d+', { useRegex: true });
      expect(pattern?.test('123')).toBe(true);
      expect(pattern?.test('abc')).toBe(false);
    });

    it('should return null for empty query', () => {
      expect(createSearchPattern('')).toBeNull();
    });

    it('should return null for invalid regex', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const pattern = createSearchPattern('[invalid', { useRegex: true });
      expect(pattern).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('searchText', () => {
    const sampleText = 'Hello world, hello universe, HELLO cosmos';

    it('should find all case-insensitive matches', () => {
      const results = searchText(sampleText, 'hello');
      expect(results).toHaveLength(3);
      expect(results[0].index).toBe(0);
      expect(results[1].index).toBe(13);
      expect(results[2].index).toBe(29);
    });

    it('should find case-sensitive matches', () => {
      const results = searchText(sampleText, 'hello', { caseSensitive: true });
      expect(results).toHaveLength(1);
      expect(results[0].index).toBe(13);
    });

    it('should find whole-word matches', () => {
      const text = 'test testing retest test123';
      const results = searchText(text, 'test', { wholeWord: true });
      expect(results).toHaveLength(1);
      expect(results[0].match).toBe('test');
    });

    it('should find regex matches', () => {
      const text = 'abc123 def456 ghi789';
      const results = searchText(text, '\\d+', { useRegex: true });
      expect(results).toHaveLength(3);
      expect(results[0].match).toBe('123');
      expect(results[1].match).toBe('456');
      expect(results[2].match).toBe('789');
    });

    it('should return empty array for empty text', () => {
      expect(searchText('', 'hello')).toEqual([]);
    });

    it('should return empty array for empty query', () => {
      expect(searchText('hello', '')).toEqual([]);
    });

    it('should return empty array for no matches', () => {
      expect(searchText('hello world', 'xyz')).toEqual([]);
    });

    it('should handle overlapping matches correctly', () => {
      const text = 'aaa';
      const results = searchText(text, 'aa');
      // Note: RegExp.exec() doesn't find overlapping matches by default
      // It will find 'aa' at index 0, but not the overlapping 'aa' at index 1
      expect(results).toHaveLength(1);
      expect(results[0].index).toBe(0);
    });
  });

  describe('getPositionFromIndex', () => {
    const text = 'Line 1\nLine 2\nLine 3';

    it('should get position from index at start', () => {
      const pos = getPositionFromIndex(text, 0);
      expect(pos).toEqual({ line: 1, column: 1 });
    });

    it('should get position from index in middle of first line', () => {
      const pos = getPositionFromIndex(text, 3);
      expect(pos).toEqual({ line: 1, column: 4 });
    });

    it('should get position from index at start of second line', () => {
      const pos = getPositionFromIndex(text, 7);
      expect(pos).toEqual({ line: 2, column: 1 });
    });

    it('should get position from index in middle of second line', () => {
      const pos = getPositionFromIndex(text, 10);
      expect(pos).toEqual({ line: 2, column: 4 });
    });

    it('should get position from index at end of text', () => {
      const pos = getPositionFromIndex(text, text.length);
      expect(pos).toEqual({ line: 3, column: 7 });
    });
  });

  describe('getIndexFromPosition', () => {
    const text = 'Line 1\nLine 2\nLine 3';

    it('should get index from position at start', () => {
      const index = getIndexFromPosition(text, 1, 1);
      expect(index).toBe(0);
    });

    it('should get index from position in middle of first line', () => {
      const index = getIndexFromPosition(text, 1, 4);
      expect(index).toBe(3);
    });

    it('should get index from position at start of second line', () => {
      const index = getIndexFromPosition(text, 2, 1);
      expect(index).toBe(7);
    });

    it('should get index from position in middle of second line', () => {
      const index = getIndexFromPosition(text, 2, 4);
      expect(index).toBe(10);
    });

    it('should handle position beyond line length', () => {
      const index = getIndexFromPosition(text, 1, 100);
      expect(index).toBe(6); // End of first line
    });
  });

  describe('replaceAtIndex', () => {
    it('should replace text at the specified index', () => {
      const text = 'Hello world';
      const result = replaceAtIndex(text, 6, 5, 'universe');
      expect(result).toBe('Hello universe');
    });

    it('should replace text at the start', () => {
      const text = 'Hello world';
      const result = replaceAtIndex(text, 0, 5, 'Hi');
      expect(result).toBe('Hi world');
    });

    it('should replace text at the end', () => {
      const text = 'Hello world';
      const result = replaceAtIndex(text, 6, 5, 'everyone!');
      expect(result).toBe('Hello everyone!');
    });

    it('should handle empty replacement', () => {
      const text = 'Hello world';
      const result = replaceAtIndex(text, 5, 6, '');
      expect(result).toBe('Hello');
    });
  });

  describe('replaceMatch', () => {
    it('should replace a single match', () => {
      const text = 'Hello world';
      const result: SearchResult = { index: 6, length: 5, match: 'world' };
      const { newText, newLength } = replaceMatch(text, result, 'universe');
      expect(newText).toBe('Hello universe');
      expect(newLength).toBe(8);
    });

    it('should handle shorter replacement', () => {
      const text = 'Hello world';
      const result: SearchResult = { index: 6, length: 5, match: 'world' };
      const { newText, newLength } = replaceMatch(text, result, 'all');
      expect(newText).toBe('Hello all');
      expect(newLength).toBe(3);
    });

    it('should handle longer replacement', () => {
      const text = 'Hello world';
      const result: SearchResult = { index: 6, length: 5, match: 'world' };
      const { newText, newLength } = replaceMatch(text, result, 'everyone in the world');
      expect(newText).toBe('Hello everyone in the world');
      expect(newLength).toBe(21);
    });
  });

  describe('replaceAll', () => {
    it('should replace all occurrences', () => {
      const text = 'hello hello hello';
      const { newText, count } = replaceAll(text, 'hello', 'hi');
      expect(newText).toBe('hi hi hi');
      expect(count).toBe(3);
    });

    it('should replace all case-insensitive occurrences', () => {
      const text = 'Hello hello HELLO';
      const { newText, count } = replaceAll(text, 'hello', 'hi');
      expect(newText).toBe('hi hi hi');
      expect(count).toBe(3);
    });

    it('should replace all case-sensitive occurrences', () => {
      const text = 'Hello hello HELLO';
      const { newText, count } = replaceAll(text, 'hello', 'hi', { caseSensitive: true });
      expect(newText).toBe('Hello hi HELLO');
      expect(count).toBe(1);
    });

    it('should handle no matches', () => {
      const text = 'hello world';
      const { newText, count } = replaceAll(text, 'xyz', 'abc');
      expect(newText).toBe('hello world');
      expect(count).toBe(0);
    });

    it('should handle empty text', () => {
      const { newText, count } = replaceAll('', 'hello', 'hi');
      expect(newText).toBe('');
      expect(count).toBe(0);
    });

    it('should handle empty query', () => {
      const text = 'hello world';
      const { newText, count } = replaceAll(text, '', 'hi');
      expect(newText).toBe(text);
      expect(count).toBe(0);
    });

    it('should handle different lengths correctly', () => {
      const text = 'a a a';
      const { newText, count } = replaceAll(text, 'a', 'abc');
      expect(newText).toBe('abc abc abc');
      expect(count).toBe(3);
    });
  });

  describe('getNextResultIndex', () => {
    it('should get next index', () => {
      expect(getNextResultIndex(0, 5)).toBe(1);
      expect(getNextResultIndex(2, 5)).toBe(3);
    });

    it('should wrap around to start', () => {
      expect(getNextResultIndex(4, 5)).toBe(0);
    });

    it('should return -1 for no results', () => {
      expect(getNextResultIndex(0, 0)).toBe(-1);
    });
  });

  describe('getPreviousResultIndex', () => {
    it('should get previous index', () => {
      expect(getPreviousResultIndex(3, 5)).toBe(2);
      expect(getPreviousResultIndex(1, 5)).toBe(0);
    });

    it('should wrap around to end', () => {
      expect(getPreviousResultIndex(0, 5)).toBe(4);
    });

    it('should return -1 for no results', () => {
      expect(getPreviousResultIndex(0, 0)).toBe(-1);
    });
  });

  describe('isValidRegex', () => {
    it('should return true for valid regex', () => {
      expect(isValidRegex('hello')).toBe(true);
      expect(isValidRegex('\\d+')).toBe(true);
      expect(isValidRegex('[a-z]+')).toBe(true);
      expect(isValidRegex('(test|demo)')).toBe(true);
    });

    it('should return false for invalid regex', () => {
      expect(isValidRegex('[invalid')).toBe(false);
      expect(isValidRegex('(unclosed')).toBe(false);
      expect(isValidRegex('*invalid')).toBe(false);
    });

    it('should return true for empty string', () => {
      expect(isValidRegex('')).toBe(true);
    });
  });

  describe('getHighlightRanges', () => {
    it('should convert search results to highlight ranges', () => {
      const results: SearchResult[] = [
        { index: 0, length: 5, match: 'hello' },
        { index: 10, length: 5, match: 'world' },
      ];
      const ranges = getHighlightRanges(results);
      expect(ranges).toEqual([
        { start: 0, end: 5 },
        { start: 10, end: 15 },
      ]);
    });

    it('should handle empty results', () => {
      expect(getHighlightRanges([])).toEqual([]);
    });

    it('should handle multiple results', () => {
      const results: SearchResult[] = [
        { index: 0, length: 3, match: 'the' },
        { index: 10, length: 3, match: 'the' },
        { index: 20, length: 3, match: 'the' },
      ];
      const ranges = getHighlightRanges(results);
      expect(ranges).toHaveLength(3);
      expect(ranges[0]).toEqual({ start: 0, end: 3 });
      expect(ranges[1]).toEqual({ start: 10, end: 13 });
      expect(ranges[2]).toEqual({ start: 20, end: 23 });
    });
  });
});
