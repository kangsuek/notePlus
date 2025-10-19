import { ipcMain } from 'electron';

/**
 * 앱 상태 핸들러 설정
 */
export function setupAppHandlers() {
  ipcMain.handle('app:get-is-dirty', () => {
    try {
      // 윈도우 객체에서 isDirty 상태 가져오기
      const isDirty = (global as any).__isDirty__ || false;
      return { success: true, isDirty };
    } catch (error) {
      console.error('App get isDirty error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        isDirty: false,
      };
    }
  });
}
