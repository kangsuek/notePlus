import { ipcMain } from 'electron';
import { SettingsManager, EditorSettings } from '../SettingsManager';

// 설정 관리자
const settingsManager = new SettingsManager();

// 타입 가드 함수
function isValidSettings(obj: unknown): obj is Partial<EditorSettings> {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  const settings = obj as Record<string, unknown>;
  if ('showLineNumbers' in settings && typeof settings.showLineNumbers !== 'boolean') {
    return false;
  }
  if ('fontFamily' in settings && typeof settings.fontFamily !== 'string') {
    return false;
  }
  if ('fontSize' in settings && typeof settings.fontSize !== 'number') {
    return false;
  }
  return true;
}

/**
 * 설정 핸들러 설정
 */
export function setupSettingsHandlers() {
  ipcMain.handle('settings:get', () => {
    try {
      const settings = settingsManager.getSettings();
      return { success: true, settings };
    } catch (error) {
      console.error('Settings get error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        settings: {},
      };
    }
  });

  ipcMain.handle('settings:save', (_event, settings: unknown) => {
    try {
      if (isValidSettings(settings)) {
        settingsManager.saveSettings(settings);
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Invalid settings format',
        };
      }
    } catch (error) {
      console.error('Settings save error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  ipcMain.handle('settings:reset', () => {
    try {
      settingsManager.resetSettings();
      return { success: true };
    } catch (error) {
      console.error('Settings reset error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
}
