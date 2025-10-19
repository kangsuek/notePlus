/**
 * UI 관련 상수들
 */

// 파일명 관련 상수
export const DEFAULT_FILENAME = 'untitled.txt';
export const MAX_FILENAME_LENGTH = 255;

// 경로 축약 관련 상수
export const DEFAULT_PATH_MAX_LENGTH = 40;

// 줄바꿈 계산 관련 상수
export const MIN_WRAPPED_LINES = 1;

// 검색 관련 상수
export const SEARCH_DEBOUNCE_DELAY = 300;
export const SEARCH_HIGHLIGHT_CLASS = 'search-highlight';
export const SEARCH_HIGHLIGHT_ACTIVE_CLASS = 'search-highlight-active';

// 에디터 관련 상수
export const TAB_SIZE = 4;
export const DEFAULT_FONT_FAMILY = 'Monaco, Menlo, "Ubuntu Mono", monospace';
export const DEFAULT_FONT_SIZE = 14;

// 마크다운 관련 상수
export const MARKDOWN_EXTENSIONS = ['.md', '.markdown'];
export const HTML_EXTENSIONS = ['.html', '.htm'];
export const TEXT_EXTENSIONS = ['.txt'];

// 테마 관련 상수
export const THEME_STORAGE_KEY = 'noteplus-theme';
export const DEFAULT_THEME = 'light';

// 최근 파일 관련 상수
export const MAX_RECENT_FILES = 10;

// 에러 처리 관련 상수
export const MAX_ERROR_REPORTS = 50;
export const MAX_RETRIES = 3;
export const RETRY_DELAY_BASE = 1000; // 1초

// 성능 관련 상수
export const THROTTLE_DELAY = 16; // 60fps
export const DEBOUNCE_DELAY = 300;
