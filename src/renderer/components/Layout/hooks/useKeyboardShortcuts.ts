import { useEffect } from 'react';

export interface UseKeyboardShortcutsProps {
  handleNew: () => void;
  handleSave: () => Promise<void>;
  handleSaveAs: () => Promise<void>;
  handleOpen: () => Promise<void>;
}

export function useKeyboardShortcuts({
  handleNew,
  handleSave,
  handleSaveAs,
  handleOpen,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+N (macOS) 또는 Ctrl+N (Windows/Linux) - 새 파일
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleNew();
      }
      // Cmd+S (macOS) 또는 Ctrl+S (Windows/Linux) - 저장
      else if ((e.metaKey || e.ctrlKey) && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      }
      // Cmd+Shift+S (macOS) 또는 Ctrl+Shift+S (Windows/Linux) - 다른 이름으로 저장
      else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 's') {
        e.preventDefault();
        handleSaveAs();
      }
      // Cmd+O (macOS) 또는 Ctrl+O (Windows/Linux) - 열기
      else if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault();
        handleOpen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleNew, handleSave, handleSaveAs, handleOpen]);
}
