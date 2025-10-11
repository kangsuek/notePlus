import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { ERROR_MESSAGES } from '@renderer/constants';
import type { MarkdownPreviewProps } from '@renderer/types';
import './MarkdownPreview.css';

/**
 * 마크다운을 HTML로 렌더링하는 컴포넌트
 * - marked 라이브러리로 마크다운 파싱
 * - DOMPurify로 XSS 공격 방지
 * - useMemo로 성능 최적화
 */
const MarkdownPreview: React.FC<MarkdownPreviewProps> = React.memo(({ markdown }) => {
  // marked 옵션 설정 (한 번만 실행)
  useMemo(() => {
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown 지원
      breaks: true, // 줄바꿈을 <br>로 변환
    });
  }, []);

  // 마크다운을 HTML로 변환 (메모이제이션)
  const htmlContent = useMemo(() => {
    if (!markdown || markdown.trim() === '') {
      return '';
    }

    try {
      // 1. 마크다운을 HTML로 변환
      const rawHtml = marked.parse(markdown, { async: false }) as string;

      // 2. DOMPurify로 위험한 HTML 제거 (XSS 방지)
      const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'p',
          'br',
          'hr',
          'strong',
          'em',
          'del',
          's',
          'ins',
          'u',
          'a',
          'img',
          'ul',
          'ol',
          'li',
          'blockquote',
          'pre',
          'code',
          'table',
          'thead',
          'tbody',
          'tr',
          'th',
          'td',
          'div',
          'span',
          'input', // task list를 위한 checkbox
        ],
        ALLOWED_ATTR: [
          'href',
          'src',
          'alt',
          'title',
          'class',
          'id',
          'target',
          'rel',
          'align',
          'valign',
          'type',
          'checked',
          'disabled', // checkbox 속성
        ],
      });

      // 3. 계산 결과를 파란색으로 표시 (= 숫자 패턴)
      // 예: "2 + 3 = 5" → "2 + 3 = <span class="calc-result">5</span>"
      const withStyledResults = sanitizedHtml.replace(
        /=\s*(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/gi,
        '= <span class="calc-result">$1</span>'
      );

      return withStyledResults;
    } catch (error) {
      // 에러 로깅 (개발 환경에서만 상세 로그)
      if (process.env.NODE_ENV === 'development') {
        console.error('Markdown parsing error:', error);
      }

      // 사용자에게 친화적인 에러 메시지 반환
      const errorMessage =
        error instanceof Error
          ? `마크다운 파싱 오류: ${error.message}`
          : ERROR_MESSAGES.MARKDOWN_PARSE_ERROR;

      return `<div class="markdown-error">
        <p>⚠️ ${errorMessage}</p>
        <p>마크다운 문법을 확인해주세요.</p>
      </div>`;
    }
  }, [markdown]);

  return (
    <div
      className="markdown-preview"
      data-testid="markdown-preview"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
});

MarkdownPreview.displayName = 'MarkdownPreview';

export default MarkdownPreview;
