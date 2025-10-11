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

  // textarea의 스타일 정보 가져오기
  const computedStyle = window.getComputedStyle(textareaElement);
  const font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;

  // textarea의 실제 콘텐츠 너비 계산
  const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
  const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
  const availableWidth = textareaElement.clientWidth - paddingLeft - paddingRight;

  // 스크롤바가 있으면 너비에서 제외
  if (textareaElement.scrollHeight > textareaElement.clientHeight) {
    // 실제 스크롤바 너비 계산
    const scrollbarWidth = textareaElement.offsetWidth - textareaElement.clientWidth;
    const adjustedWidth = availableWidth - scrollbarWidth;

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // 빈 줄은 한 줄로 처리
      if (line.length === 0) {
        result.push({ logicalLineNumber: lineNumber, isWrapped: false });
        return;
      }

      // 텍스트 너비 측정
      const textWidth = getTextWidth(line, font);

      if (textWidth <= adjustedWidth) {
        // 한 줄에 들어감
        result.push({ logicalLineNumber: lineNumber, isWrapped: false });
      } else {
        // 여러 줄로 나뉨 - 더 정확한 계산
        const visualLineCount = Math.ceil(textWidth / adjustedWidth);

        // 첫 번째 줄은 줄번호 표시
        result.push({ logicalLineNumber: lineNumber, isWrapped: false });

        // 나머지는 빈 줄번호 (최소 1개는 보장)
        const wrappedLines = Math.max(1, visualLineCount - 1);
        for (let i = 0; i < wrappedLines; i++) {
          result.push({ logicalLineNumber: lineNumber, isWrapped: true });
        }
      }
    });
  } else {
    // 스크롤바 없음
    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      if (line.length === 0) {
        result.push({ logicalLineNumber: lineNumber, isWrapped: false });
        return;
      }

      const textWidth = getTextWidth(line, font);

      if (textWidth <= availableWidth) {
        result.push({ logicalLineNumber: lineNumber, isWrapped: false });
      } else {
        const visualLineCount = Math.ceil(textWidth / availableWidth);
        result.push({ logicalLineNumber: lineNumber, isWrapped: false });

        // 나머지는 빈 줄번호 (최소 1개는 보장)
        const wrappedLines = Math.max(1, visualLineCount - 1);
        for (let i = 0; i < wrappedLines; i++) {
          result.push({ logicalLineNumber: lineNumber, isWrapped: true });
        }
      }
    });
  }

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
