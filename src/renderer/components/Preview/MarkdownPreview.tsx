import React, { useMemo, useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { ERROR_MESSAGES } from '@renderer/constants';
import type { MarkdownPreviewProps } from '@renderer/types';
import './MarkdownPreview.css';

interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  useRegex?: boolean;
}

interface ExtendedMarkdownPreviewProps extends MarkdownPreviewProps {
  searchQuery?: string;
  currentSearchIndex?: number;
  searchOptions?: SearchOptions;
}

/**
 * 마크다운을 HTML로 렌더링하는 컴포넌트
 * - marked 라이브러리로 마크다운 파싱
 * - DOMPurify로 XSS 공격 방지
 * - useMemo로 성능 최적화
 */
const MarkdownPreview: React.FC<ExtendedMarkdownPreviewProps> = React.memo(({
  markdown,
  searchQuery,
  currentSearchIndex = -1,
  searchOptions = { caseSensitive: false, wholeWord: false, useRegex: false },
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  // marked 옵션 설정 (한 번만 실행)
  useMemo(() => {
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown 지원
      breaks: true, // 줄바꿈을 <br>로 변환
    });
  }, []);

  // Helper function to highlight search results in HTML
  const highlightSearchInHtml = (html: string, query: string, options: SearchOptions): string => {
    if (!query || !html) return html;

    try {
      // Create a temporary DOM to work with
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      let highlightIndex = 0;

      // Function to recursively walk through text nodes
      const walkTextNodes = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || '';
          if (!text.trim()) return;

          let regex: RegExp;

          if (options.useRegex) {
            try {
              const flags = options.caseSensitive ? 'g' : 'gi';
              regex = new RegExp(query, flags);
            } catch {
              return; // Invalid regex, skip highlighting
            }
          } else {
            const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = options.wholeWord
              ? `\\b${escapedQuery}\\b`
              : escapedQuery;
            const flags = options.caseSensitive ? 'g' : 'gi';
            regex = new RegExp(pattern, flags);
          }

          const matches = text.match(regex);
          if (!matches) return;

          // Replace text node with highlighted version
          const fragment = document.createDocumentFragment();
          let lastIndex = 0;

          text.replace(regex, (match, offset) => {
            // Add text before match
            if (offset > lastIndex) {
              fragment.appendChild(document.createTextNode(text.substring(lastIndex, offset)));
            }

            // Add highlighted match
            const span = document.createElement('span');
            span.className = `search-highlight search-highlight-${highlightIndex}`;
            span.textContent = match;
            fragment.appendChild(span);

            highlightIndex++;
            lastIndex = offset + match.length;
            return match;
          });

          // Add remaining text
          if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
          }

          node.parentNode?.replaceChild(fragment, node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // Skip code blocks and pre elements
          const element = node as Element;
          if (element.tagName === 'CODE' || element.tagName === 'PRE') {
            return;
          }

          // Walk through child nodes (copy array to avoid modification issues)
          Array.from(node.childNodes).forEach(walkTextNodes);
        }
      };

      walkTextNodes(doc.body);
      return doc.body.innerHTML;
    } catch (error) {
      console.error('Error highlighting search results:', error);
      return html;
    }
  };

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
        // 보안 강화 설정
        FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input[type="submit"]', 'input[type="button"]'],
        FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
        ALLOW_DATA_ATTR: false,
        ALLOW_UNKNOWN_PROTOCOLS: false,
        SANITIZE_DOM: true,
        KEEP_CONTENT: true,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        // href 속성에 대한 추가 보안 검증
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      });

      // 3. 계산 결과를 파란색으로 표시 (= 숫자 패턴)
      // 예: "2 + 3 = 5" → "2 + 3 = <span class="calc-result">5</span>"
      const withStyledResults = sanitizedHtml.replace(
        /=\s*(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/gi,
        '= <span class="calc-result">$1</span>'
      );

      // 4. Apply search highlighting if search query exists
      const withHighlights = searchQuery
        ? highlightSearchInHtml(withStyledResults, searchQuery, searchOptions)
        : withStyledResults;

      return withHighlights;
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
  }, [markdown, searchQuery, searchOptions]);

  // Scroll to current search result
  useEffect(() => {
    if (!previewRef.current || !searchQuery || currentSearchIndex < 0) return;

    // Wait for DOM to update with new highlights
    setTimeout(() => {
      const highlights = previewRef.current?.querySelectorAll('.search-highlight');
      if (!highlights || currentSearchIndex >= highlights.length) return;

      const currentHighlight = highlights[currentSearchIndex] as HTMLElement;
      if (!currentHighlight) return;

      // Remove active class from all highlights
      highlights.forEach((el) => el.classList.remove('search-highlight-active'));

      // Add active class to current highlight
      currentHighlight.classList.add('search-highlight-active');

      // Scroll to center the highlight in the preview
      const previewContainer = previewRef.current?.parentElement;
      if (!previewContainer) return;

      const highlightTop = currentHighlight.offsetTop;
      const containerHeight = previewContainer.clientHeight;
      const scrollTop = highlightTop - containerHeight / 2;

      previewContainer.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth',
      });
    }, 50);
  }, [searchQuery, currentSearchIndex]);

  return (
    <div
      ref={previewRef}
      className="markdown-preview"
      data-testid="markdown-preview"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
});

MarkdownPreview.displayName = 'MarkdownPreview';

export default MarkdownPreview;
