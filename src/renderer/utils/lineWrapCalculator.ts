/**
 * 자동 줄바꿈 계산 유틸리티
 * textarea의 각 논리적 줄이 몇 개의 시각적 줄로 렌더링되는지 계산
 */

import type { LineWrapInfo } from '@renderer/types';

/**
 * Canvas를 사용하여 텍스트 너비 측정
 */
let canvas: HTMLCanvasElement | null = null;
let context: CanvasRenderingContext2D | null = null;

function getTextWidth(text: string, font: string): number {
  if (!canvas) {
    canvas = document.createElement('canvas');
    context = canvas.getContext('2d');
  }

  if (!context) return 0;

  // 정확한 폰트 설정
  context.font = font;
  context.textBaseline = 'top';

  const metrics = context.measureText(text);
  return metrics.width;
}

/**
 * 각 논리적 줄이 몇 개의 시각적 줄로 렌더링되는지 계산
 * @param text 전체 텍스트
 * @param textareaElement textarea DOM 엘리먼트
 * @returns 시각적 줄 정보 배열
 */
/**
 * textarea의 스타일 정보를 가져오는 헬퍼 함수
 */
function getTextareaStyleInfo(textareaElement: HTMLTextAreaElement) {
  const computedStyle = window.getComputedStyle(textareaElement);
  const font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;

  const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
  const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
  const availableWidth = textareaElement.clientWidth - paddingLeft - paddingRight;

  return { font, availableWidth };
}

/**
 * 스크롤바 너비를 고려한 실제 사용 가능한 너비 계산
 */
function getAdjustedWidth(textareaElement: HTMLTextAreaElement, availableWidth: number): number {
  if (textareaElement.scrollHeight > textareaElement.clientHeight) {
    const scrollbarWidth = textareaElement.offsetWidth - textareaElement.clientWidth;
    return availableWidth - scrollbarWidth;
  }
  return availableWidth;
}

/**
 * 단일 라인의 줄바꿈 정보를 계산하는 헬퍼 함수
 */
function calculateLineWrap(
  line: string,
  lineNumber: number,
  font: string,
  adjustedWidth: number
): LineWrapInfo[] {
  // 빈 줄은 한 줄로 처리
  if (line.length === 0) {
    return [{ logicalLineNumber: lineNumber, isWrapped: false }];
  }

  const textWidth = getTextWidth(line, font);

  if (textWidth <= adjustedWidth) {
    // 한 줄에 들어감
    return [{ logicalLineNumber: lineNumber, isWrapped: false }];
  }

  // 여러 줄로 나뉨
  const visualLineCount = Math.ceil(textWidth / adjustedWidth);
  const result: LineWrapInfo[] = [];

  // 첫 번째 줄은 줄번호 표시
  result.push({ logicalLineNumber: lineNumber, isWrapped: false });

  // 나머지는 빈 줄번호 (최소 1개는 보장)
  const wrappedLines = Math.max(1, visualLineCount - 1);
  for (let i = 0; i < wrappedLines; i++) {
    result.push({ logicalLineNumber: lineNumber, isWrapped: true });
  }

  return result;
}

export function calculateLineWraps(
  text: string,
  textareaElement: HTMLTextAreaElement | null
): LineWrapInfo[] {
  if (!textareaElement) {
    // textarea가 없으면 기본값 반환 (줄바꿈 없음)
    const lines = text.split('\n');
    return lines.map((_, index) => ({
      logicalLineNumber: index + 1,
      isWrapped: false,
    }));
  }

  const lines = text.split('\n');
  const result: LineWrapInfo[] = [];

  const { font, availableWidth } = getTextareaStyleInfo(textareaElement);
  const adjustedWidth = getAdjustedWidth(textareaElement, availableWidth);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const lineWrapInfo = calculateLineWrap(line, lineNumber, font, adjustedWidth);
    result.push(...lineWrapInfo);
  });

  return result;
}

/**
 * 시각적 줄 정보 배열에서 현재 커서가 있는 논리적 줄의 첫 시각적 줄 인덱스 찾기
 * @param lineWraps 시각적 줄 정보 배열
 * @param logicalLine 논리적 줄 번호
 * @returns 시각적 줄 인덱스 (0부터 시작)
 */
export function getVisualLineIndex(lineWraps: LineWrapInfo[], logicalLine: number): number {
  for (let i = 0; i < lineWraps.length; i++) {
    const lineInfo = lineWraps[i];
    if (lineInfo && lineInfo.logicalLineNumber === logicalLine && !lineInfo.isWrapped) {
      return i;
    }
  }
  return 0;
}
