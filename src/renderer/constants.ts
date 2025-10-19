/**
 * 애플리케이션 전역 상수 정의
 * 하드코딩된 값들을 중앙에서 관리
 */

/**
 * 에디터 설정 상수
 */
export const EDITOR_CONFIG = {
  /** Tab 키 입력 시 삽입할 스페이스 수 */
  TAB_SIZE: 4,
  /** onChange 이벤트 디바운싱 기본 시간 (ms) */
  DEBOUNCE_MS: 300,
  /** 최대 라인 수 제한 (성능 고려) */
  MAX_LINES: 10000,
  /** 라인 넘버 최소 너비 (px) */
  LINE_NUMBER_MIN_WIDTH: 50,
} as const;

/**
 * UI 설정 상수
 */
export const UI_CONFIG = {
  /** StatusBar 상태 표시 지속 시간 (ms) */
  STATUS_DISPLAY_DURATION: 3000,
  /** Sidebar 최소 너비 (px) */
  SIDEBAR_MIN_WIDTH: 200,
  /** Sidebar 최대 너비 (px) */
  SIDEBAR_MAX_WIDTH: 400,
  /** TitleBar 높이 (px) */
  TITLE_BAR_HEIGHT: 52,
  /** StatusBar 높이 (px) */
  STATUS_BAR_HEIGHT: 32,
  /** 헤더 공통 높이 (px) */
  HEADER_HEIGHT: 48,
} as const;

/**
 * 파일 관련 상수
 */
export const FILE_CONFIG = {
  /** 기본 파일명 */
  DEFAULT_FILENAME: 'untitled.txt',
  /** 파일명 최대 길이 */
  MAX_FILENAME_LENGTH: 255,
  /** 최근 파일 목록 최대 개수 */
  RECENT_FILES_LIMIT: 10,
  /** 지원하는 파일 확장자 */
  SUPPORTED_EXTENSIONS: ['.md', '.markdown', '.txt'] as const,
} as const;

/**
 * 테마 관련 상수
 */
export const THEME_CONFIG = {
  /** 기본 테마 */
  DEFAULT_THEME: 'light' as const,
  /** localStorage 키 */
  STORAGE_KEY: 'noteplus-theme',
  /** 사용 가능한 테마 */
  THEMES: ['light', 'dark'] as const,
} as const;

/**
 * 키보드 단축키
 */
export const KEYBOARD_SHORTCUTS = {
  BOLD: { key: 'b', metaKey: true },
  ITALIC: { key: 'i', metaKey: true },
  LINK: { key: 'k', metaKey: true },
  NEW_FILE: { key: 'n', metaKey: true },
  OPEN_FILE: { key: 'o', metaKey: true },
  SAVE_FILE: { key: 's', metaKey: true },
} as const;

/**
 * 마크다운 문법 관련
 */
export const MARKDOWN_SYNTAX = {
  BOLD: '**',
  ITALIC: '*',
  CODE: '`',
  LINK_TEMPLATE: '[text](url)',
  IMAGE_TEMPLATE: '![alt](url)',
  HEADING_PREFIX: '#',
} as const;

/**
 * 에러 메시지
 */
export const ERROR_MESSAGES = {
  FILE_NOT_FOUND: '파일을 찾을 수 없습니다.',
  FILE_READ_ERROR: '파일을 읽는 중 오류가 발생했습니다.',
  FILE_WRITE_ERROR: '파일을 저장하는 중 오류가 발생했습니다.',
  MARKDOWN_PARSE_ERROR: '마크다운을 렌더링하는 중 오류가 발생했습니다.',
  INVALID_FILENAME: '유효하지 않은 파일명입니다.',
} as const;

/**
 * 성능 관련 설정
 */
export const PERFORMANCE_CONFIG = {
  /** 큰 파일 경고 임계값 (bytes) */
  LARGE_FILE_THRESHOLD: 1024 * 1024, // 1MB
  /** 가상화 시작 라인 수 */
  VIRTUALIZATION_THRESHOLD: 1000,
  /** 스크롤 동기화 플래그 리셋 지연시간 (ms) */
  SCROLL_SYNC_RESET_DELAY: 50,
  /** DOM 업데이트 후 실행 지연시간 (ms) */
  DOM_UPDATE_DELAY: 100,
} as const;

/**
 * 레이아웃 관련 상수
 */
export const LAYOUT_CONFIG = {
  /** 사이드바 기본 너비 (px) */
  SIDEBAR_DEFAULT_WIDTH: 250,
  /** 에디터/프리뷰 기본 크기 비율 (%) */
  EDITOR_PREVIEW_DEFAULT_SIZE: 50,
  /** 패널 최소 크기 비율 (%) */
  PANEL_MIN_SIZE: 20,
} as const;
