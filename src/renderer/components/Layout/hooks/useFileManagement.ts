import { useState, useCallback, useRef } from 'react';
import { saveFile, saveFileAs, openFile, readFile } from '@renderer/utils/fileOperations';
import { FILE_CONFIG } from '@renderer/constants';
import type { SidebarRef } from '@renderer/types';

export interface FileState {
  currentFileName: string;
  currentFilePath: string | null;
  currentEncoding: string;
  markdownText: string;
  isDirty: boolean;
}

export interface FileActions {
  handleSave: () => Promise<void>;
  handleOpen: () => Promise<void>;
  handleNew: () => void;
  handleSaveAs: () => Promise<void>;
  handleFileOpen: (filePath: string) => Promise<void>;
  handleTextChange: (text: string) => void;
  handleFileNameChange: (newFileName: string) => void;
  setMarkdownText: (text: string) => void;
  setCurrentFilePath: (path: string | null) => void;
  setCurrentFileName: (name: string) => void;
  setCurrentEncoding: (encoding: string) => void;
  setIsDirty: (dirty: boolean) => void;
}

export interface UseFileManagementProps {
  showStatusTemporarily: () => void;
  refreshRecentFiles: () => void;
  sidebarRef: React.RefObject<SidebarRef>;
}

export function useFileManagement({
  showStatusTemporarily,
  refreshRecentFiles,
  sidebarRef,
}: UseFileManagementProps): [FileState, FileActions] {
  const [currentFileName, setCurrentFileName] = useState<string>(FILE_CONFIG.DEFAULT_FILENAME);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [currentEncoding, setCurrentEncoding] = useState<string>('UTF-8');
  const [markdownText, setMarkdownText] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const handleTextChange = useCallback(
    (text: string) => {
      setMarkdownText(text);
      setIsDirty(true);
      showStatusTemporarily();
    },
    [showStatusTemporarily]
  );

  const handleFileNameChange = useCallback(
    (newFileName: string) => {
      setCurrentFileName(newFileName);
      setIsDirty(true);
      showStatusTemporarily();
    },
    [showStatusTemporarily]
  );

  const handleSave = useCallback(async () => {
    let newFileName = currentFileName;
    if (sidebarRef.current) {
      const committedName = sidebarRef.current.commitFileName();
      if (committedName) {
        newFileName = committedName;
      }
    }

    if (currentFilePath) {
      const currentPathFileName = currentFilePath.split('/').pop() || '';
      const hasFileNameChanged = newFileName !== currentPathFileName;

      if (hasFileNameChanged) {
        const directory = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));
        const newFilePath = `${directory}/${newFileName}`;

        const result = await saveFile(newFilePath, markdownText, currentEncoding);
        if (result.success) {
          setCurrentFilePath(newFilePath);
          setIsDirty(false);
          showStatusTemporarily();
          refreshRecentFiles();
        } else {
          console.error('Failed to save file:', result.error);
        }
      } else {
        const result = await saveFile(currentFilePath, markdownText, currentEncoding);
        if (result.success) {
          setIsDirty(false);
          showStatusTemporarily();
          refreshRecentFiles();
        } else {
          console.error('Failed to save file:', result.error);
        }
      }
    } else {
      const result = await saveFileAs(markdownText, newFileName, currentEncoding);
      if (result.success && result.filePath) {
        setCurrentFilePath(result.filePath);
        const fileName = result.filePath.split('/').pop() || FILE_CONFIG.DEFAULT_FILENAME;
        setCurrentFileName(fileName);
        setIsDirty(false);
        showStatusTemporarily();
        refreshRecentFiles();
      }
    }
  }, [
    currentFilePath,
    currentFileName,
    currentEncoding,
    markdownText,
    showStatusTemporarily,
    refreshRecentFiles,
    sidebarRef,
  ]);

  const handleOpen = useCallback(async () => {
    const result = await openFile();
    if (result.success && result.content && result.filePath) {
      setMarkdownText(result.content);
      setCurrentFilePath(result.filePath);
      const fileName = result.filePath.split('/').pop() || FILE_CONFIG.DEFAULT_FILENAME;
      setCurrentFileName(fileName);
      setCurrentEncoding(result.encoding || 'UTF-8');
      setIsDirty(false);
      refreshRecentFiles();
    }
  }, [refreshRecentFiles]);

  const handleNew = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm('저장하지 않은 변경사항이 있습니다. 계속하시겠습니까?');
      if (!confirmed) return;
    }

    setMarkdownText('');
    setCurrentFilePath(null);
    setCurrentFileName(FILE_CONFIG.DEFAULT_FILENAME);
    setIsDirty(false);
  }, [isDirty]);

  const handleSaveAs = useCallback(async () => {
    let newFileName = currentFileName;
    if (sidebarRef.current) {
      const committedName = sidebarRef.current.commitFileName();
      if (committedName) {
        newFileName = committedName;
      }
    }

    const result = await saveFileAs(markdownText, newFileName, currentEncoding);
    if (result.success && result.filePath) {
      setCurrentFilePath(result.filePath);
      const fileName = result.filePath.split('/').pop() || FILE_CONFIG.DEFAULT_FILENAME;
      setCurrentFileName(fileName);
      setIsDirty(false);
      showStatusTemporarily();
    }
  }, [markdownText, currentFileName, currentEncoding, showStatusTemporarily, sidebarRef]);

  const handleFileOpen = useCallback(
    async (filePath: string) => {
      const result = await readFile(filePath);
      if (result.success && result.content) {
        setMarkdownText(result.content);
        setCurrentFilePath(filePath);
        const fileName = filePath.split('/').pop() || FILE_CONFIG.DEFAULT_FILENAME;
        setCurrentFileName(fileName);
        setCurrentEncoding(result.encoding || 'UTF-8');
        setIsDirty(false);
        refreshRecentFiles();
      } else {
        console.error('Failed to open file:', result.error);
      }
    },
    [refreshRecentFiles]
  );

  const fileState: FileState = {
    currentFileName,
    currentFilePath,
    currentEncoding,
    markdownText,
    isDirty,
  };

  const fileActions: FileActions = {
    handleSave,
    handleOpen,
    handleNew,
    handleSaveAs,
    handleFileOpen,
    handleTextChange,
    handleFileNameChange,
    setMarkdownText,
    setCurrentFilePath,
    setCurrentFileName,
    setCurrentEncoding,
    setIsDirty,
  };

  return [fileState, fileActions];
}
