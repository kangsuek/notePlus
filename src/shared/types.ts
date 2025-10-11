/**
 * 파일 정보 인터페이스
 */
export interface FileInfo {
  path: string;
  name: string;
  content: string;
  lastModified: Date;
  encoding: string;
}

/**
 * IPC 채널 타입
 */
export type IPCChannel =
  | 'file:new'
  | 'file:open'
  | 'file:save'
  | 'file:saveAs'
  | 'file:opened'
  | 'file:saved'
  | 'dialog:openFile'
  | 'dialog:saveFile'
  | 'file:read'
  | 'file:write'
  | 'menu:action'
  | 'theme:changed'
  | 'window:minimize'
  | 'window:maximize'
  | 'window:close'
  | 'app:getPath';

/**
 * 메뉴 액션 타입
 */
export type MenuAction =
  | 'new-file'
  | 'open-file'
  | 'save-file'
  | 'save-file-as'
  | 'close-file'
  | 'undo'
  | 'redo'
  | 'cut'
  | 'copy'
  | 'paste'
  | 'toggle-sidebar'
  | 'toggle-devtools';

/**
 * 테마 타입
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * 앱 설정 인터페이스
 */
export interface AppSettings {
  theme: Theme;
  fontSize: number;
  autoSave: boolean;
  recentFiles: string[];
}

