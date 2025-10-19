/**
 * IPC 핸들러들을 설정하는 모듈
 */

import { setupDialogHandlers } from './dialogHandlers';
import { setupFileHandlers } from './fileHandlers';
import { setupRecentFilesHandlers } from './recentFilesHandlers';
import { setupSettingsHandlers } from './settingsHandlers';
import { setupAppHandlers } from './appHandlers';

/**
 * 모든 IPC 핸들러 설정
 */
export function setupAllHandlers() {
  setupDialogHandlers();
  setupFileHandlers();
  setupRecentFilesHandlers();
  setupSettingsHandlers();
  setupAppHandlers();
}
