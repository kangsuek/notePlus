/**
 * 보안 유틸리티 함수들
 * - 경로 조작 공격 방지
 * - 입력 검증 및 sanitization
 * - 보안 정책 적용
 */

import path from 'path';

/**
 * 경로 조작 공격을 방지하는 안전한 경로 검증
 * @param filePath 검증할 파일 경로
 * @param basePath 기준 경로 (기본값: 사용자 홈 디렉토리)
 * @returns 안전한 경로인지 여부
 */
export function isSafePath(filePath: string, basePath?: string): boolean {
  try {
    // 빈 문자열이나 null/undefined 체크
    if (!filePath || typeof filePath !== 'string') {
      return false;
    }

    // 경로 정규화
    const normalizedPath = path.normalize(filePath);
    const base = basePath || process.env.HOME || process.env.USERPROFILE || '/';
    const normalizedBase = path.normalize(base);

    // 상대 경로 조작 시도 감지
    if (normalizedPath.includes('..') || normalizedPath.includes('~')) {
      return false;
    }

    // 기준 경로를 벗어나는지 확인
    const resolvedPath = path.resolve(normalizedBase, normalizedPath);
    return resolvedPath.startsWith(normalizedBase);
  } catch (error) {
    console.warn('Path validation error:', error);
    return false;
  }
}

/**
 * 파일명에서 위험한 문자 제거
 * @param fileName 원본 파일명
 * @returns 안전한 파일명
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return 'untitled.txt';
  }

  let sanitized = fileName.trim();

  // Windows 금지 문자 제거 (슬래시 포함)
  sanitized = sanitized.replace(/[<>:"|?*\/]/g, '');

  // 상위 디렉토리 참조 제거
  sanitized = sanitized.replace(/\.\./g, '');

  // 제어 문자 제거
  sanitized = sanitized.replace(/[\x00-\x1f\x7f-\x9f]/g, '');

  // Windows 예약어 검사
  const reservedNames = [
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
  ];
  const nameWithoutExt = path.basename(sanitized, path.extname(sanitized));
  if (reservedNames.includes(nameWithoutExt.toUpperCase())) {
    return 'untitled.txt';
  }

  // 점만으로 구성된 이름 검사
  if (/^\.+$/.test(sanitized)) {
    return 'untitled.txt';
  }

  // 길이 제한 (255자)
  if (sanitized.length > 255) {
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    const maxNameLength = 255 - ext.length;
    sanitized = name.substring(0, maxNameLength) + ext;
  }

  // 빈 문자열이면 기본값 반환
  if (!sanitized || sanitized.length === 0) {
    return 'untitled.txt';
  }

  return sanitized;
}

/**
 * URL 검증 및 sanitization
 * @param url 검증할 URL
 * @returns 안전한 URL인지 여부
 */
export function isSafeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);

    // 허용된 프로토콜만 허용
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return false;
    }

    // JavaScript 프로토콜 차단
    if (urlObj.protocol === 'javascript:' || urlObj.href.includes('javascript:')) {
      return false;
    }

    // 데이터 URI 차단 (보안상 위험)
    if (urlObj.protocol === 'data:') {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * HTML 콘텐츠에서 위험한 패턴 검사
 * @param content 검사할 HTML 콘텐츠
 * @returns 위험한 패턴이 포함되어 있는지 여부
 */
export function containsDangerousPatterns(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }

  const dangerousPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick, onload 등
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
    /<form[^>]*>/i,
    /<input[^>]*type\s*=\s*["']?(submit|button)["']?[^>]*>/i,
    /<link[^>]*rel\s*=\s*["']?stylesheet["']?[^>]*>/i,
    /<meta[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/i,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(content));
}

/**
 * 환경 변수에서 민감한 정보 제거
 * @param obj 로깅할 객체
 * @returns 민감한 정보가 제거된 객체
 */
export function sanitizeForLogging(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // 민감한 정보 패턴 제거
    return obj
      .replace(/password[=:]\s*[^\s&]+/gi, 'password=***')
      .replace(/token[=:]\s*[^\s&]+/gi, 'token=***')
      .replace(/key[=:]\s*[^\s&]+/gi, 'key=***')
      .replace(/secret[=:]\s*[^\s&]+/gi, 'secret=***');
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForLogging(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // 민감한 키 제외
      if (
        ['password', 'token', 'key', 'secret', 'apikey', 'authtoken', 'privatekey'].includes(
          key.toLowerCase()
        )
      ) {
        sanitized[key] = '***';
      } else {
        sanitized[key] = sanitizeForLogging(value);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * 개발 환경에서만 로깅 허용
 * @param message 로그 메시지
 * @param data 로그 데이터
 */
export function secureLog(message: string, data?: any): void {
  // 프로덕션 환경에서는 민감한 정보 로깅 방지
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  if (data) {
    console.log(message, sanitizeForLogging(data));
  } else {
    console.log(message);
  }
}
