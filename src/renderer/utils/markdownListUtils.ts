/**
 * 마크다운 목록 처리 유틸리티
 * 순서 없는 목록, 순서 있는 목록, 체크박스, 인용문 패턴 인식 및 처리
 */

/**
 * 마크다운 목록 패턴 정보
 */
export interface MarkdownListPattern {
  type: 'unordered' | 'ordered' | 'checkbox' | 'blockquote' | 'none';
  indent: string; // 들여쓰기 (공백)
  marker: string; // 목록 마커 (-, *, +, 1., >, 등)
  content: string; // 마커 이후 내용
  isChecked?: boolean; // 체크박스인 경우 체크 여부
  orderNumber?: number; // 순서 있는 목록인 경우 번호
}

/**
 * 현재 줄의 마크다운 목록 패턴 분석
 *
 * @param line 분석할 줄 텍스트
 * @returns 목록 패턴 정보
 *
 * @example
 * parseMarkdownList('  - Hello')
 * // { type: 'unordered', indent: '  ', marker: '-', content: 'Hello' }
 *
 * parseMarkdownList('1. First item')
 * // { type: 'ordered', indent: '', marker: '1.', content: 'First item', orderNumber: 1 }
 *
 * parseMarkdownList('- [ ] Todo')
 * // { type: 'checkbox', indent: '', marker: '-', content: 'Todo', isChecked: false }
 */
export function parseMarkdownList(line: string): MarkdownListPattern {
  // 1. 순서 없는 목록: - , * , +
  const unorderedMatch = line.match(/^(\s*)([-*+])\s+(.*)$/);
  if (unorderedMatch) {
    const [, indent, marker, afterMarker] = unorderedMatch;

    // 체크박스 확인: - [ ] 또는 - [x]
    const checkboxMatch = afterMarker.match(/^\[([ x])\]\s+(.*)$/);
    if (marker === '-' && checkboxMatch) {
      const [, checkState, content] = checkboxMatch;
      return {
        type: 'checkbox',
        indent,
        marker,
        content,
        isChecked: checkState === 'x',
      };
    }

    return {
      type: 'unordered',
      indent,
      marker,
      content: afterMarker,
    };
  }

  // 2. 순서 있는 목록: 1. , 2. , 3.
  const orderedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
  if (orderedMatch) {
    const [, indent, number, content] = orderedMatch;
    return {
      type: 'ordered',
      indent,
      marker: `${number}.`,
      content,
      orderNumber: parseInt(number, 10),
    };
  }

  // 3. 인용문: >
  const blockquoteMatch = line.match(/^(\s*)(>)\s*(.*)$/);
  if (blockquoteMatch) {
    const [, indent, marker, content] = blockquoteMatch;
    return {
      type: 'blockquote',
      indent,
      marker,
      content,
    };
  }

  // 4. 목록이 아님
  return {
    type: 'none',
    indent: '',
    marker: '',
    content: line,
  };
}

/**
 * 목록 패턴이 비어있는지 확인 (마커만 있고 내용 없음)
 *
 * @param pattern 목록 패턴 정보
 * @returns 빈 목록 여부
 *
 * @example
 * isEmptyListItem({ type: 'unordered', indent: '', marker: '-', content: '' })
 * // true
 *
 * isEmptyListItem({ type: 'unordered', indent: '', marker: '-', content: 'Hello' })
 * // false
 */
export function isEmptyListItem(pattern: MarkdownListPattern): boolean {
  return pattern.type !== 'none' && pattern.content.trim() === '';
}

/**
 * 다음 목록 항목 생성 (Enter 키 입력 시)
 *
 * @param pattern 현재 줄의 목록 패턴
 * @returns 다음 줄에 삽입할 텍스트
 *
 * @example
 * generateNextListItem({ type: 'unordered', indent: '  ', marker: '-', content: 'Hello' })
 * // '\n  - '
 *
 * generateNextListItem({ type: 'ordered', indent: '', marker: '1.', content: 'First', orderNumber: 1 })
 * // '\n2. '
 *
 * generateNextListItem({ type: 'checkbox', indent: '', marker: '-', content: '', isChecked: false })
 * // '\n' (빈 체크박스는 목록 종료)
 */
export function generateNextListItem(pattern: MarkdownListPattern): string {
  // 빈 목록 항목 → 목록 종료
  if (isEmptyListItem(pattern)) {
    return '\n';
  }

  const { type, indent, marker, orderNumber, isChecked } = pattern;

  switch (type) {
    case 'unordered':
      return `\n${indent}${marker} `;

    case 'ordered':
      // 다음 번호로 증가
      const nextNumber = (orderNumber || 1) + 1;
      return `\n${indent}${nextNumber}. `;

    case 'checkbox':
      // 항상 빈 체크박스로 생성
      return `\n${indent}- [ ] `;

    case 'blockquote':
      return `\n${indent}> `;

    case 'none':
    default:
      return '\n';
  }
}

/**
 * 빈 목록 항목 제거 (목록 종료 시)
 *
 * @param text 전체 텍스트
 * @param lineStart 현재 줄 시작 위치
 * @param lineEnd 현재 줄 끝 위치
 * @returns 빈 목록 항목이 제거된 텍스트와 커서 위치
 *
 * @example
 * removeEmptyListItem('Hello\n- \nWorld', 6, 8)
 * // { newText: 'Hello\n\nWorld', cursorPos: 6 }
 */
export function removeEmptyListItem(
  text: string,
  lineStart: number,
  lineEnd: number
): { newText: string; cursorPos: number } {
  const newText = text.substring(0, lineStart) + text.substring(lineEnd);
  return {
    newText,
    cursorPos: lineStart,
  };
}
