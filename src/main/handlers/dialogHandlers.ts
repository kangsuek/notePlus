import { ipcMain, dialog } from 'electron';
import path from 'path';

// 최근 저장/열기 위치 기억
let lastSavePath: string | undefined;
let lastOpenPath: string | undefined;

/**
 * 파일 저장 다이얼로그 핸들러
 */
export function setupDialogHandlers() {
  ipcMain.handle('dialog:saveFile', async (_event, currentFileName?: string) => {
    try {
      const result = await dialog.showSaveDialog({
        title: '파일 저장',
        defaultPath: currentFileName || lastSavePath,
        filters: [
          { name: '모든 파일', extensions: ['*'] },
          { name: '마크다운 파일', extensions: ['md', 'markdown'] },
          { name: '텍스트 파일', extensions: ['txt'] },
          { name: 'HTML 파일', extensions: ['html', 'htm'] },
        ],
        properties: ['showOverwriteConfirmation'],
      });

      if (!result.canceled && result.filePath) {
        lastSavePath = path.dirname(result.filePath);
        return { success: true, filePath: result.filePath };
      }

      return { success: false, canceled: true };
    } catch (error) {
      console.error('Save dialog error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('dialog:openFile', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: '파일 열기',
        defaultPath: lastOpenPath,
        filters: [
          { name: '모든 파일', extensions: ['*'] },
          { name: '마크다운 파일', extensions: ['md', 'markdown'] },
          { name: '텍스트 파일', extensions: ['txt'] },
          { name: 'HTML 파일', extensions: ['html', 'htm'] },
        ],
        properties: ['openFile', 'multiSelections'],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        lastOpenPath = path.dirname(result.filePaths[0]);
        return { success: true, filePaths: result.filePaths };
      }

      return { success: false, canceled: true };
    } catch (error) {
      console.error('Open dialog error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });
}
