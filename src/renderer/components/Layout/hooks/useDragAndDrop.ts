import { useState, useCallback } from 'react';
import { PERFORMANCE_CONFIG } from '@renderer/constants';

export interface UseDragAndDropProps {
  onFileOpen: (filePath: string) => Promise<void>;
  onTextChange: (text: string) => void;
  onFilePathChange: (path: string | null) => void;
  onFileNameChange: (name: string) => void;
  onEncodingChange: (encoding: string) => void;
  onDirtyChange: (dirty: boolean) => void;
  onUserTogglePreviewChange: (toggle: boolean | null) => void;
  onSearchStateReset: () => void;
  onScrollToTop: () => void;
  onRefreshRecentFiles: () => void;
}

export function useDragAndDrop({
  onFileOpen,
  onTextChange,
  onFilePathChange,
  onFileNameChange,
  onEncodingChange,
  onDirtyChange,
  onUserTogglePreviewChange,
  onSearchStateReset,
  onScrollToTop,
  onRefreshRecentFiles,
}: UseDragAndDropProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 드래그가 완전히 영역을 벗어났을 때만 상태 변경
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      // 첫 번째 파일만 처리
      const file = files[0];
      if (!file) return;

      try {
        // File 객체를 FileReader로 읽기
        const reader = new FileReader();
        reader.onload = async (event) => {
          const content = event.target?.result as string;
          if (content) {
            onTextChange(content);
            onFilePathChange(file.name); // 파일명을 경로로 사용
            onFileNameChange(file.name);
            onDirtyChange(false);

            // 파일을 열 때 사용자 토글 상태 리셋 (파일 타입에 따라 자동 결정)
            onUserTogglePreviewChange(null);

            // 검색 상태 초기화
            onSearchStateReset();

            // 스크롤을 맨 위로 이동
            onScrollToTop();

            // 최근 파일 목록에 추가 (드래그 앤 드롭으로 열린 파일도 포함)
            // 드래그 앤 드롭 파일은 고유한 식별자로 관리 (파일명 + 타임스탬프)
            if (window.electronAPI) {
              try {
                const uniqueId = `dropped:${file.name}:${Date.now()}`;
                await window.electronAPI.invoke('recent-files:add', uniqueId);
              } catch (error) {
                console.warn('Failed to add file to recent files:', error);
              }
            }

            // 최근 파일 목록 새로고침
            onRefreshRecentFiles();
          }
        };
        reader.readAsText(file);
      } catch (error) {
        console.error('Failed to read dropped file:', error);
      }
    },
    [
      onFileOpen,
      onTextChange,
      onFilePathChange,
      onFileNameChange,
      onEncodingChange,
      onDirtyChange,
      onUserTogglePreviewChange,
      onSearchStateReset,
      onScrollToTop,
      onRefreshRecentFiles,
    ]
  );

  return {
    isDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  };
}
