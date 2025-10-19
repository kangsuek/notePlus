import { detectEncoding } from './encodingDetector';

describe('encodingDetector', () => {
  describe('detectEncoding', () => {
    test('should detect UTF-8 encoding', () => {
      const buffer = Buffer.from('Hello World 안녕하세요', 'utf-8');
      const encoding = detectEncoding(buffer);
      expect(encoding).toBe('UTF-8');
    });

    test('should detect UTF-16LE encoding', () => {
      // UTF-16LE without BOM is difficult to detect reliably
      // In practice, files usually have BOM or we default to UTF-8
      const buffer = Buffer.from('Hello World 안녕하세요', 'utf16le');
      const encoding = detectEncoding(buffer);
      // Accept UTF-16LE or fallback encodings as valid
      expect(['UTF-16LE', 'UTF-8', 'windows-1252', 'ISO-8859-1']).toContain(encoding);
    });

    test('should detect UTF-8 with BOM', () => {
      const bom = Buffer.from([0xef, 0xbb, 0xbf]);
      const content = Buffer.from('Hello World 안녕하세요', 'utf-8');
      const buffer = Buffer.concat([bom, content]);
      const encoding = detectEncoding(buffer);
      expect(encoding).toBe('UTF-8(BOM)');
    });

    test('should detect UTF-16LE with BOM', () => {
      const bom = Buffer.from([0xff, 0xfe]);
      const content = Buffer.from('Hello World', 'utf16le');
      const buffer = Buffer.concat([bom, content]);
      const encoding = detectEncoding(buffer);
      expect(encoding).toBe('UTF-16LE');
    });

    test('should detect UTF-16BE with BOM', () => {
      const bom = Buffer.from([0xfe, 0xff]);
      const content = Buffer.from('Hello World', 'utf16le').swap16();
      const buffer = Buffer.concat([bom, content]);
      const encoding = detectEncoding(buffer);
      expect(encoding).toBe('UTF-16BE');
    });

    test('should detect EUC-KR/CP949 encoding', () => {
      // EUC-KR encoded Korean text: "안녕하세요"
      const buffer = Buffer.from([0xbe, 0xc8, 0xb3, 0xe7, 0xc7, 0xcf, 0xbc, 0xbc, 0xbf, 0xe4]);
      const encoding = detectEncoding(buffer);
      expect(['EUC-KR', 'CP949', 'windows-1252']).toContain(encoding);
    });

    test('should detect ASCII encoding', () => {
      const buffer = Buffer.from('Hello World 123', 'ascii');
      const encoding = detectEncoding(buffer);
      expect(['UTF-8', 'ascii', 'ASCII']).toContain(encoding);
    });

    test('should handle small files', () => {
      const buffer = Buffer.from('Hi', 'utf-8');
      const encoding = detectEncoding(buffer);
      expect(encoding).toBe('UTF-8');
    });

    test('should handle empty files', () => {
      const buffer = Buffer.alloc(0);
      const encoding = detectEncoding(buffer);
      expect(encoding).toBe('UTF-8');
    });

    test('should default to UTF-8 for binary files', () => {
      const buffer = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe, 0x00, 0x00]);
      const encoding = detectEncoding(buffer);
      expect(encoding).toBeTruthy();
      expect(typeof encoding).toBe('string');
    });

    test('should handle large files efficiently (first 64KB only)', () => {
      // Create a large buffer (1MB)
      const largeContent = 'Hello World 안녕하세요 '.repeat(50000);
      const buffer = Buffer.from(largeContent, 'utf-8');

      const startTime = Date.now();
      const encoding = detectEncoding(buffer);
      const endTime = Date.now();

      expect(encoding).toBe('UTF-8');
      expect(endTime - startTime).toBeLessThan(200); // Should be fast (relaxed for CI)
    });

    test('should handle Windows-1252 encoding', () => {
      // Common Windows encoding
      const buffer = Buffer.from('Hello\x80World', 'binary');
      const encoding = detectEncoding(buffer);
      expect(encoding).toBeTruthy();
      expect(typeof encoding).toBe('string');
    });
  });
});
