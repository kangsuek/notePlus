/**
 * 공통 타입 정의
 * 애플리케이션 전역에서 사용하는 TypeScript 타입
 */

/**
 * 커서 위치 정보
 */
export interface CursorPosition {
  line: number;
  column: number;
}

/**
 * 파일 정보
 */
export interface FileInfo {
  name: string;
  path: string;
  lastModified: Date;
  size: number;
}

/**
 * 테마 타입
 */
export type Theme = 'light' | 'dark';

/**
 * 에디터 Props
 */
export interface EditorProps {
  value?: string;
  onChange?: (value: string) => void;
  onCursorChange?: (position: CursorPosition) => void;
  debounceMs?: number;
  onScroll?: (event: React.UIEvent<HTMLTextAreaElement>) => void;
  onTextareaRef?: (ref: HTMLTextAreaElement | null) => void;
  fileName?: string; // 파일명 (마크다운 기능 활성화 판별용)
  showLineNumbers?: boolean; // 줄 번호 표시 여부
  fontFamily?: string; // 폰트 설정
  fontSize?: number; // 폰트 크기
}

/**
 * StatusBar Props
 */
export interface StatusBarProps {
  cursorPosition?: CursorPosition;
  encoding?: string;
  isDirty?: boolean;
  showStatus?: boolean;
}

/**
 * Sidebar Props
 */
export interface SidebarProps {
  currentFileName?: string;
  onFileNameChange?: (newFileName: string) => void;
  isDirty?: boolean;
  onFileOpen?: (filePath: string) => Promise<void>;
  onNewFile?: () => void;
  onRefreshRecentFiles?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export interface SidebarRef {
  refreshRecentFiles: () => void;
  commitFileName: () => string | null; // 편집 중인 파일명을 저장하고 반환 (변경된 경우 새 파일명, 아니면 null)
}

/**
 * 최근 문서 항목
 */
export interface RecentDocument {
  id: string;
  fileName: string;
  filePath: string;
  lastOpened: Date;
}

/**
 * 에러 정보
 */
export interface ErrorInfo {
  message: string;
  code?: string;
  timestamp: Date;
}

/**
 * 마크다운 프리뷰 Props
 */
export interface MarkdownPreviewProps {
  markdown: string;
}

/**
 * 자동 줄바꿈 정보
 */
export interface LineWrapInfo {
  logicalLineNumber: number; // 논리적 줄 번호 (1부터 시작)
  isWrapped: boolean; // 자동 줄바꿈된 줄인지 여부
}

/**
 * LineNumbers Props
 */
export interface LineNumbersProps {
  lineWraps: LineWrapInfo[]; // 시각적 줄 정보
  currentLine: number; // 현재 커서가 있는 논리적 줄 번호
}

/**
 * 키보드 단축키 정보
 */
export interface KeyboardShortcut {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

/**
 * 앱 설정
 */
export interface AppSettings {
  theme: Theme;
  fontSize: number;
  tabSize: number;
  autoSave: boolean;
  wordWrap: boolean;
}

/**
 * IPC 채널 타입
 */
export type IPCChannel =
  | 'file:open'
  | 'file:save'
  | 'file:save-as'
  | 'file:new'
  | 'app:get-version'
  | 'window:close'
  | 'window:minimize'
  | 'window:maximize';
