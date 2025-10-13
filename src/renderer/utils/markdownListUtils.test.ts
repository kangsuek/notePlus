import {
  parseMarkdownList,
  isEmptyListItem,
  generateNextListItem,
  removeEmptyListItem,
} from './markdownListUtils';

describe('markdownListUtils', () => {
  describe('parseMarkdownList', () => {
    describe('순서 없는 목록', () => {
      it('should parse unordered list with -', () => {
        const result = parseMarkdownList('- Hello');
        expect(result).toEqual({
          type: 'unordered',
          indent: '',
          marker: '-',
          content: 'Hello',
        });
      });

      it('should parse unordered list with *', () => {
        const result = parseMarkdownList('* World');
        expect(result).toEqual({
          type: 'unordered',
          indent: '',
          marker: '*',
          content: 'World',
        });
      });

      it('should parse unordered list with +', () => {
        const result = parseMarkdownList('+ Test');
        expect(result).toEqual({
          type: 'unordered',
          indent: '',
          marker: '+',
          content: 'Test',
        });
      });

      it('should parse indented unordered list', () => {
        const result = parseMarkdownList('  - Nested item');
        expect(result).toEqual({
          type: 'unordered',
          indent: '  ',
          marker: '-',
          content: 'Nested item',
        });
      });
    });

    describe('순서 있는 목록', () => {
      it('should parse ordered list', () => {
        const result = parseMarkdownList('1. First item');
        expect(result).toEqual({
          type: 'ordered',
          indent: '',
          marker: '1.',
          content: 'First item',
          orderNumber: 1,
        });
      });

      it('should parse ordered list with number > 9', () => {
        const result = parseMarkdownList('10. Tenth item');
        expect(result).toEqual({
          type: 'ordered',
          indent: '',
          marker: '10.',
          content: 'Tenth item',
          orderNumber: 10,
        });
      });

      it('should parse indented ordered list', () => {
        const result = parseMarkdownList('    2. Second nested item');
        expect(result).toEqual({
          type: 'ordered',
          indent: '    ',
          marker: '2.',
          content: 'Second nested item',
          orderNumber: 2,
        });
      });
    });

    describe('체크박스', () => {
      it('should parse unchecked checkbox', () => {
        const result = parseMarkdownList('- [ ] Todo item');
        expect(result).toEqual({
          type: 'checkbox',
          indent: '',
          marker: '-',
          content: 'Todo item',
          isChecked: false,
        });
      });

      it('should parse checked checkbox', () => {
        const result = parseMarkdownList('- [x] Done item');
        expect(result).toEqual({
          type: 'checkbox',
          indent: '',
          marker: '-',
          content: 'Done item',
          isChecked: true,
        });
      });

      it('should parse indented checkbox', () => {
        const result = parseMarkdownList('  - [ ] Nested todo');
        expect(result).toEqual({
          type: 'checkbox',
          indent: '  ',
          marker: '-',
          content: 'Nested todo',
          isChecked: false,
        });
      });
    });

    describe('인용문', () => {
      it('should parse blockquote', () => {
        const result = parseMarkdownList('> Quote text');
        expect(result).toEqual({
          type: 'blockquote',
          indent: '',
          marker: '>',
          content: 'Quote text',
        });
      });

      it('should parse blockquote without space after marker', () => {
        const result = parseMarkdownList('>Quote');
        expect(result).toEqual({
          type: 'blockquote',
          indent: '',
          marker: '>',
          content: 'Quote',
        });
      });

      it('should parse indented blockquote', () => {
        const result = parseMarkdownList('  > Nested quote');
        expect(result).toEqual({
          type: 'blockquote',
          indent: '  ',
          marker: '>',
          content: 'Nested quote',
        });
      });
    });

    describe('목록이 아닌 경우', () => {
      it('should return none for plain text', () => {
        const result = parseMarkdownList('Just plain text');
        expect(result).toEqual({
          type: 'none',
          indent: '',
          marker: '',
          content: 'Just plain text',
        });
      });

      it('should return none for heading', () => {
        const result = parseMarkdownList('# Heading');
        expect(result).toEqual({
          type: 'none',
          indent: '',
          marker: '',
          content: '# Heading',
        });
      });
    });
  });

  describe('isEmptyListItem', () => {
    it('should return true for empty unordered list', () => {
      const pattern = parseMarkdownList('- ');
      expect(isEmptyListItem(pattern)).toBe(true);
    });

    it('should return true for empty ordered list', () => {
      const pattern = parseMarkdownList('1. ');
      expect(isEmptyListItem(pattern)).toBe(true);
    });

    it('should return true for empty checkbox', () => {
      const pattern = parseMarkdownList('- [ ] ');
      expect(isEmptyListItem(pattern)).toBe(true);
    });

    it('should return true for empty blockquote', () => {
      const pattern = parseMarkdownList('> ');
      expect(isEmptyListItem(pattern)).toBe(true);
    });

    it('should return false for non-empty list', () => {
      const pattern = parseMarkdownList('- Content');
      expect(isEmptyListItem(pattern)).toBe(false);
    });

    it('should return false for none type', () => {
      const pattern = parseMarkdownList('Plain text');
      expect(isEmptyListItem(pattern)).toBe(false);
    });
  });

  describe('generateNextListItem', () => {
    describe('빈 목록 항목 → 목록 종료', () => {
      it('should return newline for empty unordered list', () => {
        const pattern = parseMarkdownList('- ');
        expect(generateNextListItem(pattern)).toBe('\n');
      });

      it('should return newline for empty checkbox', () => {
        const pattern = parseMarkdownList('- [ ] ');
        expect(generateNextListItem(pattern)).toBe('\n');
      });
    });

    describe('순서 없는 목록', () => {
      it('should generate next unordered item with -', () => {
        const pattern = parseMarkdownList('- First');
        expect(generateNextListItem(pattern)).toBe('\n- ');
      });

      it('should generate next unordered item with *', () => {
        const pattern = parseMarkdownList('* First');
        expect(generateNextListItem(pattern)).toBe('\n* ');
      });

      it('should preserve indentation', () => {
        const pattern = parseMarkdownList('  - Nested');
        expect(generateNextListItem(pattern)).toBe('\n  - ');
      });
    });

    describe('순서 있는 목록', () => {
      it('should increment order number', () => {
        const pattern = parseMarkdownList('1. First');
        expect(generateNextListItem(pattern)).toBe('\n2. ');
      });

      it('should increment from any number', () => {
        const pattern = parseMarkdownList('5. Fifth');
        expect(generateNextListItem(pattern)).toBe('\n6. ');
      });

      it('should preserve indentation and increment', () => {
        const pattern = parseMarkdownList('    3. Third nested');
        expect(generateNextListItem(pattern)).toBe('\n    4. ');
      });
    });

    describe('체크박스', () => {
      it('should generate unchecked checkbox', () => {
        const pattern = parseMarkdownList('- [ ] Todo');
        expect(generateNextListItem(pattern)).toBe('\n- [ ] ');
      });

      it('should always generate unchecked checkbox even if previous was checked', () => {
        const pattern = parseMarkdownList('- [x] Done');
        expect(generateNextListItem(pattern)).toBe('\n- [ ] ');
      });
    });

    describe('인용문', () => {
      it('should generate next blockquote', () => {
        const pattern = parseMarkdownList('> Quote');
        expect(generateNextListItem(pattern)).toBe('\n> ');
      });

      it('should preserve indentation', () => {
        const pattern = parseMarkdownList('  > Nested quote');
        expect(generateNextListItem(pattern)).toBe('\n  > ');
      });
    });
  });

  describe('removeEmptyListItem', () => {
    it('should remove empty list item line', () => {
      const text = 'Line 1\n- \nLine 3';
      // lineStart=7 (줄 시작), lineEnd=9 (줄 끝, 개행 문자 제외)
      // 개행 문자까지 포함하려면 lineEnd=10
      const result = removeEmptyListItem(text, 7, 10);
      expect(result.newText).toBe('Line 1\nLine 3');
      expect(result.cursorPos).toBe(7);
    });

    it('should handle list item at the end', () => {
      const text = 'Line 1\n- ';
      const result = removeEmptyListItem(text, 7, 9);
      expect(result.newText).toBe('Line 1\n');
      expect(result.cursorPos).toBe(7);
    });

    it('should handle list item at the beginning', () => {
      const text = '- \nLine 2';
      const result = removeEmptyListItem(text, 0, 2);
      expect(result.newText).toBe('\nLine 2');
      expect(result.cursorPos).toBe(0);
    });
  });
});
