/**
 * 파일 관련 유틸리티 함수
 */

/**
 * 파일 확장자 추출
 * @param filePath 파일 경로
 * @returns 확장자 (소문자, 점 포함)
 */
export function getFileExtension(filePath: string): string {
  const lastDotIndex = filePath.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return '';
  }
  return filePath.substring(lastDotIndex).toLowerCase();
}

/**
 * 파일명에서 확장자 추출
 * @param fileName 파일명
 * @returns 확장자 (소문자, 점 포함)
 */
export function getFileExtensionFromName(fileName: string): string {
  return getFileExtension(fileName);
}

/**
 * 마크다운 파일인지 확인
 * @param filePath 파일 경로 또는 파일명
 * @returns 마크다운 파일 여부
 */
export function isMarkdownFile(filePath: string): boolean {
  const extension = getFileExtension(filePath);
  return extension === '.md' || extension === '.markdown';
}

/**
 * 텍스트 파일인지 확인
 * @param filePath 파일 경로 또는 파일명
 * @returns 텍스트 파일 여부
 */
export function isTextFile(filePath: string): boolean {
  const extension = getFileExtension(filePath);
  return extension === '.txt';
}

/**
 * HTML 파일인지 확인
 * @param filePath 파일 경로 또는 파일명
 * @returns HTML 파일 여부
 */
export function isHtmlFile(filePath: string): boolean {
  const extension = getFileExtension(filePath);
  return extension === '.html' || extension === '.htm';
}

/**
 * 프리뷰를 표시해야 하는 파일인지 확인
 * @param filePath 파일 경로 또는 파일명
 * @returns 프리뷰 표시 여부
 */
export function shouldShowPreview(filePath: string): boolean {
  return isMarkdownFile(filePath) || isHtmlFile(filePath);
}

/**
 * 파일명에서 확장자를 제거한 기본 이름 추출
 * @param fileName 파일명
 * @returns 확장자가 제거된 파일명
 */
export function getFileNameWithoutExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return fileName;
  }
  return fileName.substring(0, lastDotIndex);
}

/**
 * 파일명에 확장자 추가
 * @param fileName 확장자가 없는 파일명
 * @param extension 확장자 (점 포함, 예: '.md')
 * @returns 확장자가 추가된 파일명
 */
export function addExtensionToFileName(fileName: string, extension: string): string {
  // 확장자가 이미 있는지 확인
  if (fileName.includes('.')) {
    return fileName; // 이미 확장자가 있으면 그대로 반환
  }

  // 확장자가 점으로 시작하지 않으면 점 추가
  const normalizedExtension = extension.startsWith('.') ? extension : `.${extension}`;
  return `${fileName}${normalizedExtension}`;
}

/**
 * 파일명에서 확장자 변경
 * @param fileName 원본 파일명
 * @param newExtension 새로운 확장자 (점 포함, 예: '.txt')
 * @returns 확장자가 변경된 파일명
 */
export function changeFileExtension(fileName: string, newExtension: string): string {
  const nameWithoutExt = getFileNameWithoutExtension(fileName);
  const normalizedExtension = newExtension.startsWith('.') ? newExtension : `.${newExtension}`;
  return `${nameWithoutExt}${normalizedExtension}`;
}
