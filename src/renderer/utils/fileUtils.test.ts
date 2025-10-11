import {
  getFileExtension,
  getFileExtensionFromName,
  isMarkdownFile,
  isHtmlFile,
  isTextFile,
  shouldShowPreview,
  getFileNameWithoutExtension,
  addExtensionToFileName,
  changeFileExtension,
} from './fileUtils';

describe('fileUtils', () => {
  describe('getFileExtension', () => {
    it('should extract file extension with dot', () => {
      expect(getFileExtension('/path/to/file.md')).toBe('.md');
      expect(getFileExtension('/path/to/file.txt')).toBe('.txt');
      expect(getFileExtension('/path/to/file.MD')).toBe('.md'); // 소문자 변환
    });

    it('should return empty string for files without extension', () => {
      expect(getFileExtension('/path/to/file')).toBe('');
      expect(getFileExtension('file')).toBe('');
    });

    it('should handle multiple dots correctly', () => {
      expect(getFileExtension('/path/to/file.backup.md')).toBe('.md');
    });
  });

  describe('getFileExtensionFromName', () => {
    it('should work the same as getFileExtension', () => {
      expect(getFileExtensionFromName('file.md')).toBe('.md');
      expect(getFileExtensionFromName('file.txt')).toBe('.txt');
    });
  });

  describe('isMarkdownFile', () => {
    it('should return true for markdown files', () => {
      expect(isMarkdownFile('/path/to/file.md')).toBe(true);
      expect(isMarkdownFile('/path/to/file.markdown')).toBe(true);
      expect(isMarkdownFile('file.md')).toBe(true);
      expect(isMarkdownFile('file.MD')).toBe(true); // 대소문자 무관
    });

    it('should return false for non-markdown files', () => {
      expect(isMarkdownFile('/path/to/file.txt')).toBe(false);
      expect(isMarkdownFile('/path/to/file.js')).toBe(false);
      expect(isMarkdownFile('file')).toBe(false);
    });
  });

  describe('isHtmlFile', () => {
    it('should return true for HTML files', () => {
      expect(isHtmlFile('/path/to/file.html')).toBe(true);
      expect(isHtmlFile('/path/to/file.htm')).toBe(true);
      expect(isHtmlFile('file.html')).toBe(true);
      expect(isHtmlFile('file.HTML')).toBe(true); // 대소문자 무관
    });

    it('should return false for non-HTML files', () => {
      expect(isHtmlFile('/path/to/file.md')).toBe(false);
      expect(isHtmlFile('/path/to/file.txt')).toBe(false);
      expect(isHtmlFile('/path/to/file.js')).toBe(false);
      expect(isHtmlFile('file')).toBe(false);
    });
  });

  describe('isTextFile', () => {
    it('should return true for text files', () => {
      expect(isTextFile('/path/to/file.txt')).toBe(true);
      expect(isTextFile('file.txt')).toBe(true);
      expect(isTextFile('file.TXT')).toBe(true); // 대소문자 무관
    });

    it('should return false for non-text files', () => {
      expect(isTextFile('/path/to/file.md')).toBe(false);
      expect(isTextFile('/path/to/file.js')).toBe(false);
      expect(isTextFile('file')).toBe(false);
    });
  });

  describe('shouldShowPreview', () => {
    it('should return true for markdown files', () => {
      expect(shouldShowPreview('/path/to/file.md')).toBe(true);
      expect(shouldShowPreview('/path/to/file.markdown')).toBe(true);
    });

    it('should return true for HTML files', () => {
      expect(shouldShowPreview('/path/to/file.html')).toBe(true);
      expect(shouldShowPreview('/path/to/file.htm')).toBe(true);
    });

    it('should return false for text files', () => {
      expect(shouldShowPreview('/path/to/file.txt')).toBe(false);
    });

    it('should return false for other files', () => {
      expect(shouldShowPreview('/path/to/file.js')).toBe(false);
      expect(shouldShowPreview('file')).toBe(false);
    });
  });

  describe('getFileNameWithoutExtension', () => {
    it('should remove extension from filename', () => {
      expect(getFileNameWithoutExtension('document.md')).toBe('document');
      expect(getFileNameWithoutExtension('file.txt')).toBe('file');
      expect(getFileNameWithoutExtension('script.js')).toBe('script');
    });

    it('should return original name if no extension', () => {
      expect(getFileNameWithoutExtension('README')).toBe('README');
      expect(getFileNameWithoutExtension('file')).toBe('file');
    });

    it('should handle multiple dots correctly', () => {
      expect(getFileNameWithoutExtension('file.backup.md')).toBe('file.backup');
      expect(getFileNameWithoutExtension('archive.tar.gz')).toBe('archive.tar');
    });
  });

  describe('addExtensionToFileName', () => {
    it('should add extension to filename without extension', () => {
      expect(addExtensionToFileName('document', '.md')).toBe('document.md');
      expect(addExtensionToFileName('file', 'txt')).toBe('file.txt');
      expect(addExtensionToFileName('script', '.js')).toBe('script.js');
    });

    it('should not add extension if already has one', () => {
      expect(addExtensionToFileName('document.md', '.txt')).toBe('document.md');
      expect(addExtensionToFileName('file.txt', '.js')).toBe('file.txt');
    });

    it('should handle extension with or without dot', () => {
      expect(addExtensionToFileName('file', 'md')).toBe('file.md');
      expect(addExtensionToFileName('file', '.md')).toBe('file.md');
    });
  });

  describe('changeFileExtension', () => {
    it('should change file extension', () => {
      expect(changeFileExtension('document.md', '.txt')).toBe('document.txt');
      expect(changeFileExtension('file.txt', '.js')).toBe('file.js');
      expect(changeFileExtension('script.js', 'ts')).toBe('script.ts');
    });

    it('should handle extension with or without dot', () => {
      expect(changeFileExtension('document.md', 'txt')).toBe('document.txt');
      expect(changeFileExtension('file.txt', '.js')).toBe('file.js');
    });

    it('should handle files without extension', () => {
      expect(changeFileExtension('README', '.md')).toBe('README.md');
      expect(changeFileExtension('file', 'txt')).toBe('file.txt');
    });

    it('should handle multiple dots correctly', () => {
      expect(changeFileExtension('file.backup.md', '.txt')).toBe('file.backup.txt');
      expect(changeFileExtension('archive.tar.gz', '.zip')).toBe('archive.tar.zip');
    });
  });
});
