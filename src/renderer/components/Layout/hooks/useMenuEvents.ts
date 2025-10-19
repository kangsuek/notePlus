import { useEffect } from 'react';
import type { EditorRef } from '@renderer/types';

export interface UseMenuEventsProps {
  handleNew: () => void;
  handleOpen: () => Promise<void>;
  handleSave: () => Promise<void>;
  handleSaveAs: () => Promise<void>;
  isSidebarCollapsed: boolean;
  onSidebarToggle: () => void;
  handleFileOpen: (filePath: string) => Promise<void>;
  onPreferencesOpen: () => void;
  editorRef: React.RefObject<EditorRef>;
}

export function useMenuEvents({
  handleNew,
  handleOpen,
  handleSave,
  handleSaveAs,
  isSidebarCollapsed,
  onSidebarToggle,
  handleFileOpen,
  onPreferencesOpen,
  editorRef,
}: UseMenuEventsProps) {
  useEffect(() => {
    if (!window.electronAPI) return;

    // 메뉴 → 새 파일
    window.electronAPI.on('menu:new-file', () => {
      handleNew();
    });

    // 메뉴 → 열기
    window.electronAPI.on('menu:open-file', () => {
      handleOpen();
    });

    // 메뉴 → 저장
    window.electronAPI.on('menu:save-file', () => {
      handleSave();
    });

    // 메뉴 → 다른 이름으로 저장
    window.electronAPI.on('menu:save-file-as', () => {
      handleSaveAs();
    });

    // 메뉴 → 사이드바 토글
    window.electronAPI.on('menu:toggle-sidebar', () => {
      onSidebarToggle();
    });

    // 메뉴 → 최근 문서 열기
    window.electronAPI.on('menu:open-recent-file', (...args: unknown[]) => {
      const filePath = args[0] as string;
      handleFileOpen(filePath);
    });

    // 메뉴 → 환경설정
    window.electronAPI.on('menu:preferences', () => {
      onPreferencesOpen();
    });

    // 메뉴 → 찾기
    window.electronAPI.on('menu:find', () => {
      if (editorRef.current) {
        editorRef.current.openSearch();
      }
    });

    // 메뉴 → 바꾸기
    window.electronAPI.on('menu:replace', () => {
      if (editorRef.current) {
        editorRef.current.openReplace();
      }
    });

    // 정리: IPC 리스너 제거는 electron에서 자동으로 처리됨
  }, [
    handleNew,
    handleOpen,
    handleSave,
    handleSaveAs,
    isSidebarCollapsed,
    onSidebarToggle,
    handleFileOpen,
    onPreferencesOpen,
    editorRef,
  ]);
}
