import { useRef, useCallback } from 'react';
import { rafThrottle } from '@renderer/utils/throttle';
import { PERFORMANCE_CONFIG } from '@renderer/constants';

export interface UseScrollSyncProps {
  editorTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  previewRef: React.RefObject<HTMLDivElement | null>;
}

export function useScrollSync({ editorTextareaRef, previewRef }: UseScrollSyncProps) {
  const isEditorScrolling = useRef(false);
  const isPreviewScrolling = useRef(false);

  // Editor 스크롤 → Preview 동기화 (스크롤 비율 기반)
  const handleEditorScroll = useCallback(
    rafThrottle(() => {
      if (isPreviewScrolling.current || !editorTextareaRef.current || !previewRef.current) {
        return;
      }

      isEditorScrolling.current = true;

      const editor = editorTextareaRef.current;
      const preview = previewRef.current;

      const editorScrollTop = editor.scrollTop;
      const editorMaxScroll = editor.scrollHeight - editor.clientHeight;
      const previewMaxScroll = preview.scrollHeight - preview.clientHeight;

      let previewScrollTop: number;

      // 경계 케이스 처리 (맨 위/맨 아래)
      if (editorScrollTop <= 1) {
        // 맨 위
        previewScrollTop = 0;
      } else if (editorScrollTop >= editorMaxScroll - 1) {
        // 맨 아래 (1px 허용 오차)
        previewScrollTop = previewMaxScroll;
      } else {
        // 중간: 비율 계산 (0~1 범위로 clamp)
        const scrollRatio = Math.min(1, Math.max(0, editorScrollTop / (editorMaxScroll || 1)));
        previewScrollTop = scrollRatio * previewMaxScroll;
      }

      // Preview 스크롤 적용 (반올림)
      preview.scrollTop = Math.round(previewScrollTop);

      // 플래그 리셋 (더 짧은 지연시간으로 성능 개선)
      setTimeout(() => {
        isEditorScrolling.current = false;
      }, PERFORMANCE_CONFIG.SCROLL_SYNC_RESET_DELAY);
    }),
    [isPreviewScrolling, isEditorScrolling]
  );

  // Preview 스크롤 → Editor 동기화 (스크롤 비율 기반)
  const handlePreviewScroll = useCallback(
    rafThrottle(() => {
      if (isEditorScrolling.current || !previewRef.current || !editorTextareaRef.current) {
        return;
      }

      isPreviewScrolling.current = true;

      const preview = previewRef.current;
      const editor = editorTextareaRef.current;

      const previewScrollTop = preview.scrollTop;
      const previewMaxScroll = preview.scrollHeight - preview.clientHeight;
      const editorMaxScroll = editor.scrollHeight - editor.clientHeight;

      let editorScrollTop: number;

      // 경계 케이스 처리 (맨 위/맨 아래)
      if (previewScrollTop <= 1) {
        // 맨 위
        editorScrollTop = 0;
      } else if (previewScrollTop >= previewMaxScroll - 1) {
        // 맨 아래 (1px 허용 오차)
        editorScrollTop = editorMaxScroll;
      } else {
        // 중간: 비율 계산 (0~1 범위로 clamp)
        const scrollRatio = Math.min(1, Math.max(0, previewScrollTop / (previewMaxScroll || 1)));
        editorScrollTop = scrollRatio * editorMaxScroll;
      }

      // Editor 스크롤 적용 (반올림)
      editor.scrollTop = Math.round(editorScrollTop);

      // 플래그 리셋 (더 짧은 지연시간으로 성능 개선)
      setTimeout(() => {
        isPreviewScrolling.current = false;
      }, PERFORMANCE_CONFIG.SCROLL_SYNC_RESET_DELAY);
    }),
    [isEditorScrolling, isPreviewScrolling]
  );

  // 스크롤을 맨 위로 이동하는 함수
  const scrollToTop = useCallback(() => {
    setTimeout(() => {
      if (editorTextareaRef.current) {
        editorTextareaRef.current.scrollTop = 0;
      }
      if (previewRef.current) {
        previewRef.current.scrollTop = 0;
      }
    }, PERFORMANCE_CONFIG.DOM_UPDATE_DELAY);
  }, [editorTextareaRef, previewRef]);

  return {
    handleEditorScroll,
    handlePreviewScroll,
    scrollToTop,
  };
}
