/**
 * 파일명 검증 및 정규화 유틸리티
 * Windows, macOS, Linux 파일 시스템 호환성 보장
 */

// 파일 시스템에서 금지된 문자 (/, \, :, *, ?, ", <, >, |)
const ILLEGAL_CHARS = /[/\\:*?"<>|]/;

// Windows 예약어
const RESERVED_NAMES = new Set([
  'CON',
  'PRN',
  'AUX',
  'NUL',
  'COM1',
  'COM2',
  'COM3',
  'COM4',
  'COM5',
  'COM6',
  'COM7',
  'COM8',
  'COM9',
  'LPT1',
  'LPT2',
  'LPT3',
  'LPT4',
  'LPT5',
  'LPT6',
  'LPT7',
  'LPT8',
  'LPT9',
]);

// 최대 파일명 길이 (대부분의 파일 시스템에서 255바이트)
const MAX_FILENAME_LENGTH = 255;

/**
 * 파일명이 유효한지 검증
 * @param fileName 검증할 파일명
 * @returns 유효하면 true, 아니면 false
 */
export function validateFileName(fileName: string): boolean {
  // 빈 문자열 또는 공백만 있는 경우
  if (!fileName || fileName.trim().length === 0) {
    return false;
  }

  // trim 전에 앞뒤 공백 검증
  if (fileName !== fileName.trim()) {
    return false;
  }

  const trimmed = fileName;

  // 금지된 문자 포함 여부
  if (ILLEGAL_CHARS.test(trimmed)) {
    return false;
  }

  // 파일명 길이 검증
  if (trimmed.length > MAX_FILENAME_LENGTH) {
    return false;
  }

  // 점(.)으로 시작하거나 끝나는 경우
  if (trimmed.startsWith('.')) {
    return false;
  }
  if (trimmed.endsWith('.')) {
    return false;
  }

  // Windows 예약어 검증 (확장자 제외한 이름 확인)
  const nameWithoutExt = trimmed.split('.')[0]?.toUpperCase() || '';
  if (RESERVED_NAMES.has(nameWithoutExt)) {
    return false;
  }

  return true;
}

/**
 * 파일명을 안전한 형태로 정규화
 * @param fileName 정규화할 파일명
 * @returns 정규화된 파일명
 */
export function sanitizeFileName(fileName: string): string {
  // 빈 문자열인 경우 기본값
  if (!fileName || fileName.trim().length === 0) {
    return 'untitled.txt';
  }

  // 공백 trim 및 금지 문자 제거 (새 정규식 인스턴스 사용 - replace all)
  let sanitized = fileName.trim().replace(/[/\\:*?"<>|]/g, '');

  // 여전히 빈 문자열이면 기본값
  if (sanitized.length === 0) {
    return 'untitled.txt';
  }

  // 앞뒤 점과 공백 제거
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');

  // 길이 제한
  if (sanitized.length > MAX_FILENAME_LENGTH) {
    // 확장자 보존하면서 자르기
    const parts = sanitized.split('.');
    if (parts.length > 1) {
      const ext = parts[parts.length - 1] || '';
      const name = parts.slice(0, -1).join('.');
      const maxNameLength = MAX_FILENAME_LENGTH - ext.length - 1;
      sanitized = name.substring(0, maxNameLength) + '.' + ext;
    } else {
      sanitized = sanitized.substring(0, MAX_FILENAME_LENGTH);
    }
  }

  // 최종 검증 - 여전히 유효하지 않으면 기본값
  if (!validateFileName(sanitized)) {
    return 'untitled.txt';
  }

  return sanitized;
}

/**
 * 파일명 검증 오류 메시지 반환
 * @param fileName 검증할 파일명
 * @returns 오류 메시지 (유효하면 null)
 */
export function getFileNameError(fileName: string): string | null {
  if (!fileName || fileName.trim().length === 0) {
    return '파일명을 입력해주세요.';
  }

  const trimmed = fileName.trim();

  if (ILLEGAL_CHARS.test(trimmed)) {
    return '파일명에 사용할 수 없는 문자가 포함되어 있습니다. (/ \\ : * ? " < > |)';
  }

  if (trimmed.length > MAX_FILENAME_LENGTH) {
    return `파일명이 너무 깁니다. (최대 ${MAX_FILENAME_LENGTH}자)`;
  }

  if (trimmed.startsWith('.')) {
    return '파일명은 점(.)으로 시작할 수 없습니다.';
  }

  if (trimmed.endsWith('.') || trimmed.endsWith(' ')) {
    return '파일명은 점(.)이나 공백으로 끝날 수 없습니다.';
  }

  const nameWithoutExt = trimmed.split('.')[0]?.toUpperCase() || '';
  if (RESERVED_NAMES.has(nameWithoutExt)) {
    return '시스템 예약어는 파일명으로 사용할 수 없습니다.';
  }

  return null;
}
