import { RecentFilesManager } from './RecentFilesManager';

// Mock electron-store
jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => {
    let store: Record<string, any> = {};

    return {
      get: jest.fn((key: string, defaultValue: any) => {
        return store[key] !== undefined ? store[key] : defaultValue;
      }),
      set: jest.fn((key: string, value: any) => {
        store[key] = value;
      }),
      delete: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      }),
    };
  });
});

describe('RecentFilesManager', () => {
  let manager: RecentFilesManager;

  beforeEach(() => {
    manager = new RecentFilesManager();
    // 각 테스트 전에 초기화
    manager.clear();
  });

  describe('addFile', () => {
    it('should add a file to the list', () => {
      manager.addFile('/path/to/file1.md');
      const files = manager.getFiles();

      expect(files).toHaveLength(1);
      expect(files[0]).toEqual({
        path: '/path/to/file1.md',
        lastOpened: expect.any(Date),
      });
    });

    it('should move existing file to the top', () => {
      manager.addFile('/path/to/file1.md');
      manager.addFile('/path/to/file2.md');
      manager.addFile('/path/to/file1.md'); // 다시 열기

      const files = manager.getFiles();
      expect(files).toHaveLength(2);
      expect(files[0]?.path).toBe('/path/to/file1.md'); // 최상단으로 이동
      expect(files[1]?.path).toBe('/path/to/file2.md');
    });

    it('should limit to 10 files', () => {
      // 11개 파일 추가
      for (let i = 1; i <= 11; i++) {
        manager.addFile(`/path/to/file${i}.md`);
      }

      const files = manager.getFiles();
      expect(files).toHaveLength(10); // 최대 10개만 유지
      expect(files[0]?.path).toBe('/path/to/file11.md'); // 가장 최근 파일
      expect(files[9]?.path).toBe('/path/to/file2.md'); // 11번째는 제거됨
    });

    it('should update lastOpened when adding existing file', async () => {
      manager.addFile('/path/to/file1.md');
      const firstTime = manager.getFiles()[0]?.lastOpened;

      // 약간의 시간 지연
      await new Promise((resolve) => setTimeout(resolve, 10));

      manager.addFile('/path/to/file1.md');
      const secondTime = manager.getFiles()[0]?.lastOpened;

      expect(secondTime?.getTime()).toBeGreaterThan(firstTime?.getTime() || 0);
    });

    it('should handle drag and drop files with display name', () => {
      manager.addFile('dropped:test.md:1234567890');
      const files = manager.getFiles();

      expect(files).toHaveLength(1);
      expect(files[0]).toEqual({
        path: 'dropped:test.md:1234567890',
        lastOpened: expect.any(Date),
        displayName: 'test.md',
      });
    });

    it('should handle regular files without display name', () => {
      manager.addFile('/path/to/regular.md');
      const files = manager.getFiles();

      expect(files).toHaveLength(1);
      expect(files[0]).toEqual({
        path: '/path/to/regular.md',
        lastOpened: expect.any(Date),
        displayName: undefined,
      });
    });
  });

  describe('removeFile', () => {
    it('should remove a file from the list', () => {
      manager.addFile('/path/to/file1.md');
      manager.addFile('/path/to/file2.md');

      manager.removeFile('/path/to/file1.md');

      const files = manager.getFiles();
      expect(files).toHaveLength(1);
      expect(files[0]?.path).toBe('/path/to/file2.md');
    });

    it('should do nothing if file does not exist', () => {
      manager.addFile('/path/to/file1.md');

      manager.removeFile('/path/to/nonexistent.md');

      const files = manager.getFiles();
      expect(files).toHaveLength(1);
    });
  });

  describe('getFiles', () => {
    it('should return empty array initially', () => {
      const files = manager.getFiles();
      expect(files).toEqual([]);
    });

    it('should return files sorted by lastOpened (most recent first)', () => {
      manager.addFile('/path/to/file1.md');
      manager.addFile('/path/to/file2.md');
      manager.addFile('/path/to/file3.md');

      const files = manager.getFiles();
      expect(files[0]?.path).toBe('/path/to/file3.md');
      expect(files[1]?.path).toBe('/path/to/file2.md');
      expect(files[2]?.path).toBe('/path/to/file1.md');
    });
  });

  describe('clear', () => {
    it('should clear all files', () => {
      manager.addFile('/path/to/file1.md');
      manager.addFile('/path/to/file2.md');

      manager.clear();

      const files = manager.getFiles();
      expect(files).toEqual([]);
    });
  });

  describe('hasFile', () => {
    it('should return true if file exists', () => {
      manager.addFile('/path/to/file1.md');

      expect(manager.hasFile('/path/to/file1.md')).toBe(true);
    });

    it('should return false if file does not exist', () => {
      expect(manager.hasFile('/path/to/nonexistent.md')).toBe(false);
    });
  });
});
