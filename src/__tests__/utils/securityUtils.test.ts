import {
  isSafePath,
  sanitizeFileName,
  isSafeUrl,
  containsDangerousPatterns,
  sanitizeForLogging,
  secureLog,
} from '@renderer/utils/securityUtils';

// Mock process.env
const originalEnv = process.env;

describe('securityUtils', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('isSafePath', () => {
    it('should allow safe relative paths', () => {
      expect(isSafePath('documents/file.md')).toBe(true);
      expect(isSafePath('folder/subfolder/file.txt')).toBe(true);
    });

    it('should block path traversal attacks', () => {
      expect(isSafePath('../secret/file.md')).toBe(false);
      expect(isSafePath('../../etc/passwd')).toBe(false);
      expect(isSafePath('folder/../../../etc/passwd')).toBe(false);
    });

    it('should block tilde expansion', () => {
      expect(isSafePath('~/secret/file.md')).toBe(false);
      expect(isSafePath('~/.ssh/id_rsa')).toBe(false);
    });

    it('should handle invalid paths gracefully', () => {
      expect(isSafePath('')).toBe(false);
      expect(isSafePath(null as any)).toBe(false);
      expect(isSafePath(undefined as any)).toBe(false);
    });
  });

  describe('sanitizeFileName', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeFileName('file/name.md')).toBe('filename.md');
      expect(sanitizeFileName('file:name.md')).toBe('filename.md');
      expect(sanitizeFileName('file*?<>|.md')).toBe('file.md');
    });

    it('should handle Windows reserved names', () => {
      expect(sanitizeFileName('CON.txt')).toBe('untitled.txt');
      expect(sanitizeFileName('PRN.md')).toBe('untitled.txt');
      expect(sanitizeFileName('AUX.log')).toBe('untitled.txt');
    });

    it('should limit filename length', () => {
      const longName = 'a'.repeat(300) + '.md';
      const sanitized = sanitizeFileName(longName);
      expect(sanitized.length).toBeLessThanOrEqual(255);
    });

    it('should return default for invalid input', () => {
      expect(sanitizeFileName('')).toBe('untitled.txt');
      expect(sanitizeFileName('   ')).toBe('untitled.txt');
      expect(sanitizeFileName(null as any)).toBe('untitled.txt');
      expect(sanitizeFileName(undefined as any)).toBe('untitled.txt');
    });

    it('should preserve valid filenames', () => {
      expect(sanitizeFileName('document.md')).toBe('document.md');
      expect(sanitizeFileName('my-file.txt')).toBe('my-file.txt');
      expect(sanitizeFileName('file_with_underscores.log')).toBe('file_with_underscores.log');
    });
  });

  describe('isSafeUrl', () => {
    it('should allow safe protocols', () => {
      expect(isSafeUrl('https://example.com')).toBe(true);
      expect(isSafeUrl('http://example.com')).toBe(true);
      expect(isSafeUrl('mailto:test@example.com')).toBe(true);
      expect(isSafeUrl('tel:+1234567890')).toBe(true);
    });

    it('should block dangerous protocols', () => {
      expect(isSafeUrl('javascript:alert("xss")')).toBe(false);
      expect(isSafeUrl('data:text/html,<script>alert("xss")</script>')).toBe(false);
      expect(isSafeUrl('file:///etc/passwd')).toBe(false);
    });

    it('should handle invalid URLs', () => {
      expect(isSafeUrl('not-a-url')).toBe(false);
      expect(isSafeUrl('')).toBe(false);
      expect(isSafeUrl(null as any)).toBe(false);
      expect(isSafeUrl(undefined as any)).toBe(false);
    });
  });

  describe('containsDangerousPatterns', () => {
    it('should detect script tags', () => {
      expect(containsDangerousPatterns('<script>alert("xss")</script>')).toBe(true);
      expect(containsDangerousPatterns('<SCRIPT>alert("xss")</SCRIPT>')).toBe(true);
    });

    it('should detect javascript protocols', () => {
      expect(containsDangerousPatterns('<a href="javascript:alert(1)">link</a>')).toBe(true);
      expect(containsDangerousPatterns('javascript:alert("xss")')).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(containsDangerousPatterns('<div onclick="alert(1)">click</div>')).toBe(true);
      expect(containsDangerousPatterns('<img onload="alert(1)">')).toBe(true);
    });

    it('should detect iframes and objects', () => {
      expect(containsDangerousPatterns('<iframe src="evil.com"></iframe>')).toBe(true);
      expect(containsDangerousPatterns('<object data="evil.swf"></object>')).toBe(true);
      expect(containsDangerousPatterns('<embed src="evil.swf">')).toBe(true);
    });

    it('should detect forms and dangerous inputs', () => {
      expect(containsDangerousPatterns('<form action="evil.com">')).toBe(true);
      expect(containsDangerousPatterns('<input type="submit" onclick="evil()">')).toBe(true);
    });

    it('should allow safe HTML', () => {
      expect(containsDangerousPatterns('<p>Hello world</p>')).toBe(false);
      expect(containsDangerousPatterns('<strong>Bold text</strong>')).toBe(false);
      expect(containsDangerousPatterns('<a href="https://example.com">link</a>')).toBe(false);
    });

    it('should handle invalid input', () => {
      expect(containsDangerousPatterns('')).toBe(false);
      expect(containsDangerousPatterns(null as any)).toBe(false);
      expect(containsDangerousPatterns(undefined as any)).toBe(false);
    });
  });

  describe('sanitizeForLogging', () => {
    it('should remove sensitive information from strings', () => {
      expect(sanitizeForLogging('password=secret123')).toBe('password=***');
      expect(sanitizeForLogging('token=abc123&user=john')).toBe('token=***&user=john');
      expect(sanitizeForLogging('key=private_key_here')).toBe('key=***');
    });

    it('should remove sensitive information from objects', () => {
      const obj = {
        username: 'john',
        password: 'secret123',
        token: 'abc123',
        data: 'normal data',
      };
      
      const sanitized = sanitizeForLogging(obj);
      expect(sanitized.password).toBe('***');
      expect(sanitized.token).toBe('***');
      expect(sanitized.username).toBe('john');
      expect(sanitized.data).toBe('normal data');
    });

    it('should handle arrays', () => {
      const arr = ['normal', 'password=secret', 'token=abc123'];
      const sanitized = sanitizeForLogging(arr);
      expect(sanitized[0]).toBe('normal');
      expect(sanitized[1]).toBe('password=***');
      expect(sanitized[2]).toBe('token=***');
    });

    it('should handle nested objects', () => {
      const obj = {
        user: {
          name: 'john',
          password: 'secret',
          settings: {
            apiKey: 'key123',
            theme: 'dark',
          },
        },
      };
      
      const sanitized = sanitizeForLogging(obj);
      expect(sanitized.user.password).toBe('***');
      expect(sanitized.user.settings.apiKey).toBe('***');
      expect(sanitized.user.name).toBe('john');
      expect(sanitized.user.settings.theme).toBe('dark');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeForLogging(null)).toBe(null);
      expect(sanitizeForLogging(undefined)).toBe(undefined);
    });
  });

  describe('secureLog', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log in development environment', () => {
      process.env.NODE_ENV = 'development';
      secureLog('Test message', { password: 'secret' });
      expect(consoleSpy).toHaveBeenCalledWith('Test message', { password: '***' });
    });

    it('should not log in production environment', () => {
      process.env.NODE_ENV = 'production';
      secureLog('Test message', { password: 'secret' });
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should log without data', () => {
      process.env.NODE_ENV = 'development';
      secureLog('Test message');
      expect(consoleSpy).toHaveBeenCalledWith('Test message');
    });
  });
});
