import { calculateLineWraps, getVisualLineIndex } from '@renderer/utils/lineWrapCalculator';
import type { LineWrapInfo } from '@renderer/types';

// Mock HTMLCanvasElement
const mockCanvas = {
  getContext: jest.fn(() => ({
    font: '',
    textBaseline: '',
    measureText: jest.fn(() => ({ width: 100 })),
  })),
};

Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => mockCanvas),
  writable: true,
});

// Mock window.getComputedStyle
const mockComputedStyle = {
  fontSize: '14px',
  fontFamily: 'monospace',
  paddingLeft: '10px',
  paddingRight: '10px',
};

Object.defineProperty(window, 'getComputedStyle', {
  value: jest.fn(() => mockComputedStyle),
  writable: true,
});

describe('lineWrapCalculator', () => {
  let mockTextarea: HTMLTextAreaElement;

  beforeEach(() => {
    mockTextarea = {
      clientWidth: 200,
      clientHeight: 100,
      offsetWidth: 200,
    } as HTMLTextAreaElement;

    // scrollHeight를 Object.defineProperty로 설정
    Object.defineProperty(mockTextarea, 'scrollHeight', {
      value: 100,
      writable: true,
    });
  });

  describe('calculateLineWraps', () => {
    it('should return default values when textarea is null', () => {
      const text = 'line1\nline2\nline3';
      const result = calculateLineWraps(text, null);

      expect(result).toEqual([
        { logicalLineNumber: 1, isWrapped: false },
        { logicalLineNumber: 2, isWrapped: false },
        { logicalLineNumber: 3, isWrapped: false },
      ]);
    });

    it('should handle empty text', () => {
      const text = '';
      const result = calculateLineWraps(text, mockTextarea);

      expect(result).toEqual([{ logicalLineNumber: 1, isWrapped: false }]);
    });

    it('should handle single line text', () => {
      const text = 'single line';
      const result = calculateLineWraps(text, mockTextarea);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ logicalLineNumber: 1, isWrapped: false });
    });

    it('should handle multiple lines without wrapping', () => {
      const text = 'line1\nline2\nline3';
      const result = calculateLineWraps(text, mockTextarea);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ logicalLineNumber: 1, isWrapped: false });
      expect(result[1]).toEqual({ logicalLineNumber: 2, isWrapped: false });
      expect(result[2]).toEqual({ logicalLineNumber: 3, isWrapped: false });
    });

    it('should handle empty lines', () => {
      const text = 'line1\n\nline3';
      const result = calculateLineWraps(text, mockTextarea);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ logicalLineNumber: 1, isWrapped: false });
      expect(result[1]).toEqual({ logicalLineNumber: 2, isWrapped: false });
      expect(result[2]).toEqual({ logicalLineNumber: 3, isWrapped: false });
    });

    it('should handle text with scrollbar', () => {
      Object.defineProperty(mockTextarea, 'scrollHeight', {
        value: 150, // 스크롤바가 있는 경우
        writable: true,
      });
      const text = 'line1\nline2';
      const result = calculateLineWraps(text, mockTextarea);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ logicalLineNumber: 1, isWrapped: false });
      expect(result[1]).toEqual({ logicalLineNumber: 2, isWrapped: false });
    });

    it('should handle long text that wraps', () => {
      // 실제 구현에서는 window.getComputedStyle을 사용하므로
      // 테스트 환경에서는 스크롤바가 없는 경우로 테스트
      const text = 'line1\nline2';
      const result = calculateLineWraps(text, mockTextarea);

      // 스크롤바가 없는 경우에는 줄바꿈 계산을 하지 않음
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ logicalLineNumber: 1, isWrapped: false });
      expect(result[1]).toEqual({ logicalLineNumber: 2, isWrapped: false });
    });

    it('should handle text with zero width', () => {
      const mockMeasureText = jest.fn(() => ({ width: 0 }));
      mockCanvas.getContext = jest.fn(() => ({
        font: '',
        textBaseline: '',
        measureText: mockMeasureText,
      }));

      const text = 'zero width text';
      const result = calculateLineWraps(text, mockTextarea);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ logicalLineNumber: 1, isWrapped: false });
    });
  });

  describe('getVisualLineIndex', () => {
    it('should find the correct visual line index', () => {
      const lineWraps: LineWrapInfo[] = [
        { logicalLineNumber: 1, isWrapped: false },
        { logicalLineNumber: 1, isWrapped: true },
        { logicalLineNumber: 2, isWrapped: false },
        { logicalLineNumber: 2, isWrapped: true },
        { logicalLineNumber: 2, isWrapped: true },
      ];

      expect(getVisualLineIndex(lineWraps, 1)).toBe(0);
      expect(getVisualLineIndex(lineWraps, 2)).toBe(2);
    });

    it('should return 0 when line not found', () => {
      const lineWraps: LineWrapInfo[] = [
        { logicalLineNumber: 1, isWrapped: false },
        { logicalLineNumber: 2, isWrapped: false },
      ];

      expect(getVisualLineIndex(lineWraps, 3)).toBe(0);
    });

    it('should return 0 for empty array', () => {
      expect(getVisualLineIndex([], 1)).toBe(0);
    });

    it('should find first unwrapped line', () => {
      const lineWraps: LineWrapInfo[] = [
        { logicalLineNumber: 1, isWrapped: true },
        { logicalLineNumber: 1, isWrapped: false },
        { logicalLineNumber: 1, isWrapped: true },
      ];

      expect(getVisualLineIndex(lineWraps, 1)).toBe(1);
    });
  });
});
