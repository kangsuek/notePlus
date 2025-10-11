import {
  showSaveDialog,
  showOpenDialog,
  saveFile,
  readFile,
  saveFileAs,
  openFile,
  getRecentFiles,
  removeRecentFile,
} from '@renderer/utils/fileOperations';

// Mock window.electronAPI
const mockElectronAPI = {
  invoke: jest.fn(),
};

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

describe('fileOperations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('showSaveDialog', () => {
    it('should show save dialog with default options', async () => {
      const mockResult = { canceled: false, filePath: '/test/file.md' };
      mockElectronAPI.invoke.mockResolvedValue(mockResult);

      const result = await showSaveDialog();

      expect(mockElectronAPI.invoke).toHaveBeenCalledWith('dialog:saveFile', undefined);
      expect(result).toEqual('/test/file.md');
    });

    it('should show save dialog with current filename', async () => {
      const mockResult = { canceled: false, filePath: '/test/current-file.md' };
      mockElectronAPI.invoke.mockResolvedValue(mockResult);

      const result = await showSaveDialog('current-file.md');

      expect(mockElectronAPI.invoke).toHaveBeenCalledWith('dialog:saveFile', 'current-file.md');
      expect(result).toEqual('/test/current-file.md');
    });

    it('should handle dialog cancellation', async () => {
      const mockResult = { canceled: true, filePath: undefined };
      mockElectronAPI.invoke.mockResolvedValue(mockResult);

      const result = await showSaveDialog();

      expect(result).toBeNull();
    });
  });

  describe('showOpenDialog', () => {
    it('should show open dialog with default options', async () => {
      const mockResult = { canceled: false, filePaths: ['/test/file.md'] };
      mockElectronAPI.invoke.mockResolvedValue(mockResult);

      const result = await showOpenDialog();

      expect(mockElectronAPI.invoke).toHaveBeenCalledWith('dialog:openFile');
      expect(result).toEqual('/test/file.md');
    });

    it('should show open dialog with default options only', async () => {
      const mockResult = { canceled: false, filePaths: ['/test/file.md'] };
      mockElectronAPI.invoke.mockResolvedValue(mockResult);

      const result = await showOpenDialog();

      expect(mockElectronAPI.invoke).toHaveBeenCalledWith('dialog:openFile');
      expect(result).toEqual('/test/file.md');
    });
  });

  describe('saveFile', () => {
    it('should save file successfully', async () => {
      const mockResult = { success: true, filePath: '/test/file.md' };
      mockElectronAPI.invoke.mockResolvedValue(mockResult);

      const result = await saveFile('/test/file.md', 'content');

      expect(mockElectronAPI.invoke).toHaveBeenCalledWith('file:write', '/test/file.md', 'content');
      expect(result).toEqual(mockResult);
    });

    it('should handle save file error', async () => {
      const mockResult = { success: false, error: 'Save failed' };
      mockElectronAPI.invoke.mockResolvedValue(mockResult);

      const result = await saveFile('/test/file.md', 'content');

      expect(result).toEqual(mockResult);
    });
  });

  describe('readFile', () => {
    it('should read file successfully', async () => {
      const mockResult = { success: true, content: 'file content' };
      mockElectronAPI.invoke.mockResolvedValue(mockResult);

      const result = await readFile('/test/file.md');

      expect(mockElectronAPI.invoke).toHaveBeenCalledWith('file:read', '/test/file.md');
      expect(result).toEqual(mockResult);
    });

    it('should handle read file error', async () => {
      const mockResult = { success: false, error: 'Read failed' };
      mockElectronAPI.invoke.mockResolvedValue(mockResult);

      const result = await readFile('/test/file.md');

      expect(result).toEqual(mockResult);
    });
  });

  describe('saveFileAs', () => {
    it('should save file as with dialog', async () => {
      const mockDialogResult = { canceled: false, filePath: '/new/file.md' };
      const mockSaveResult = { success: true, filePath: '/new/file.md' };

      mockElectronAPI.invoke
        .mockResolvedValueOnce(mockDialogResult)
        .mockResolvedValueOnce(mockSaveResult);

      const result = await saveFileAs('content');

      expect(mockElectronAPI.invoke).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockSaveResult);
    });

    it('should save file as with current filename', async () => {
      const mockDialogResult = { canceled: false, filePath: '/new/current-file.md' };
      const mockSaveResult = { success: true, filePath: '/new/current-file.md' };

      mockElectronAPI.invoke
        .mockResolvedValueOnce(mockDialogResult)
        .mockResolvedValueOnce(mockSaveResult);

      const result = await saveFileAs('content', 'current-file.md');

      expect(mockElectronAPI.invoke).toHaveBeenCalledWith('dialog:saveFile', 'current-file.md');
      expect(mockElectronAPI.invoke).toHaveBeenCalledWith(
        'file:write',
        '/new/current-file.md',
        'content'
      );
      expect(result).toEqual(mockSaveResult);
    });

    it('should handle dialog cancellation', async () => {
      const mockDialogResult = { canceled: true, filePath: undefined };
      mockElectronAPI.invoke.mockResolvedValue(mockDialogResult);

      const result = await saveFileAs('content');

      expect(mockElectronAPI.invoke).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ success: false, error: 'User canceled' });
    });

    it('should handle save error', async () => {
      const mockDialogResult = { canceled: false, filePath: '/new/file.md' };
      const mockSaveResult = { success: false, error: 'Save failed' };

      mockElectronAPI.invoke
        .mockResolvedValueOnce(mockDialogResult)
        .mockResolvedValueOnce(mockSaveResult);

      const result = await saveFileAs('content');

      expect(result).toEqual(mockSaveResult);
    });
  });

  describe('openFile', () => {
    it('should open file with dialog', async () => {
      const mockDialogResult = { canceled: false, filePaths: ['/test/file.md'] };
      const mockReadResult = { success: true, content: 'file content' };

      mockElectronAPI.invoke
        .mockResolvedValueOnce(mockDialogResult)
        .mockResolvedValueOnce(mockReadResult);

      const result = await openFile();

      expect(mockElectronAPI.invoke).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        success: true,
        filePath: '/test/file.md',
        content: 'file content',
      });
    });

    it('should handle dialog cancellation', async () => {
      const mockDialogResult = { canceled: true, filePaths: [] };
      mockElectronAPI.invoke.mockResolvedValue(mockDialogResult);

      const result = await openFile();

      expect(mockElectronAPI.invoke).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ success: false, error: 'User canceled' });
    });

    it('should handle read error', async () => {
      const mockDialogResult = { canceled: false, filePaths: ['/test/file.md'] };
      const mockReadResult = { success: false, error: 'Read failed' };

      mockElectronAPI.invoke
        .mockResolvedValueOnce(mockDialogResult)
        .mockResolvedValueOnce(mockReadResult);

      const result = await openFile();

      expect(result).toEqual({
        success: false,
        filePath: undefined,
        error: 'Read failed',
      });
    });
  });

  describe('getRecentFiles', () => {
    it('should get recent files successfully', async () => {
      const mockFiles = [
        { path: '/file1.md', lastOpened: new Date('2024-01-01') },
        { path: '/file2.md', lastOpened: new Date('2024-01-02') },
      ];
      const mockResult = { success: true, files: mockFiles };
      mockElectronAPI.invoke.mockResolvedValue(mockResult);

      const result = await getRecentFiles();

      expect(mockElectronAPI.invoke).toHaveBeenCalledWith('recentFiles:get');
      expect(result).toEqual(mockResult);
    });

    it('should handle get recent files error', async () => {
      const mockResult = { success: false, error: 'Get failed' };
      mockElectronAPI.invoke.mockResolvedValue(mockResult);

      const result = await getRecentFiles();

      expect(result).toEqual(mockResult);
    });
  });

  describe('removeRecentFile', () => {
    it('should remove recent file successfully', async () => {
      const mockResult = { success: true };
      mockElectronAPI.invoke.mockResolvedValue(mockResult);

      const result = await removeRecentFile('/test/file.md');

      expect(mockElectronAPI.invoke).toHaveBeenCalledWith('recentFiles:remove', '/test/file.md');
      expect(result).toEqual(mockResult);
    });

    it('should handle remove recent file error', async () => {
      const mockResult = { success: false, error: 'Remove failed' };
      mockElectronAPI.invoke.mockResolvedValue(mockResult);

      const result = await removeRecentFile('/test/file.md');

      expect(result).toEqual(mockResult);
    });
  });
});
