import { ipcMain } from 'electron';
import { RecentFilesManager } from '../RecentFilesManager';

// 최근 파일 관리자
const recentFilesManager = new RecentFilesManager();

/**
 * 최근 파일 핸들러 설정
 */
export function setupRecentFilesHandlers() {
  ipcMain.handle('recentFiles:add', (_event, filePath: string) => {
    try {
      recentFilesManager.addFile(filePath);
      return { success: true };
    } catch (error) {
      console.error('Recent files add error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  ipcMain.handle('recentFiles:get', () => {
    try {
      const files = recentFilesManager.getFiles();
      return { success: true, files };
    } catch (error) {
      console.error('Recent files get error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        files: [],
      };
    }
  });

  ipcMain.handle('recentFiles:remove', (_event, filePath: string) => {
    try {
      recentFilesManager.removeFile(filePath);
      return { success: true };
    } catch (error) {
      console.error('Recent files remove error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
}
