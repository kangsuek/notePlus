import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import TitleBar from '../TitleBar/TitleBar';
import Sidebar from '../Sidebar/Sidebar';
import Editor from '../Editor/Editor';
import Preview from '../Preview/Preview';
import StatusBar from '../StatusBar/StatusBar';
import Preferences from '../Preferences/Preferences';
import { UI_CONFIG, EDITOR_CONFIG, LAYOUT_CONFIG } from '@renderer/constants';
import type { CursorPosition, SidebarRef, EditorRef } from '@renderer/types';
import { shouldShowPreview } from '@renderer/utils/fileUtils';
import { memoryManager, useMemoryCleanup } from '@renderer/utils/memoryManager';
import {
  useFileManagement,
  useScrollSync,
  useDragAndDrop,
  useKeyboardShortcuts,
  useSettings,
  useMenuEvents,
} from './hooks';
import './MainLayout.css';

const MainLayout: React.FC = React.memo(() => {
  // 기본 상태
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ line: 1, column: 1 });
  const [showStatus, setShowStatus] = useState(false);
  const [userTogglePreview, setUserTogglePreview] = useState<boolean | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  // Search state for Preview synchronization
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentSearchIndex, setCurrentSearchIndex] = useState<number>(-1);
  const [searchOptions, setSearchOptions] = useState<{
    caseSensitive?: boolean;
    wholeWord?: boolean;
    useRegex?: boolean;
  }>({
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
  });

  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);

  // refs
  const editorTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const sidebarRef = useRef<SidebarRef | null>(null);
  const editorRef = useRef<EditorRef | null>(null);

  // 상태 표시 함수 (useCallback으로 메모이제이션)
  const showStatusTemporarily = useCallback(() => {
    // 상태 표시
    setShowStatus(true);

    // 이전 타이머 취소
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
    }

    // STATUS_DISPLAY_DURATION 후 상태 숨기기
    statusTimerRef.current = setTimeout(() => {
      setShowStatus(false);
    }, UI_CONFIG.STATUS_DISPLAY_DURATION);
  }, []);

  const handleCursorChange = useCallback((position: CursorPosition) => {
    setCursorPosition(position);
  }, []);

  // 최근 파일 목록 새로고침
  const refreshRecentFiles = useCallback(() => {
    if (sidebarRef.current) {
      sidebarRef.current.refreshRecentFiles();
    }
  }, []);

  // 커스텀 훅들 초기화
  const [fileState, fileActions] = useFileManagement({
    showStatusTemporarily,
    refreshRecentFiles,
    sidebarRef,
  });

  const { handleEditorScroll, handlePreviewScroll, scrollToTop } = useScrollSync({
    editorTextareaRef,
    previewRef,
  });

  const { editorSettings, handleSettingsChange } = useSettings();

  const { isDragOver, handleDragEnter, handleDragLeave, handleDragOver, handleDrop } =
    useDragAndDrop({
      onFileOpen: fileActions.handleFileOpen,
      onTextChange: fileActions.handleTextChange,
      onFilePathChange: fileActions.setCurrentFilePath,
      onFileNameChange: fileActions.setCurrentFileName,
      onEncodingChange: fileActions.setCurrentEncoding,
      onDirtyChange: fileActions.setIsDirty,
      onUserTogglePreviewChange: setUserTogglePreview,
      onSearchStateReset: () => {
        setSearchQuery('');
        setCurrentSearchIndex(-1);
        setSearchOptions({
          caseSensitive: false,
          wholeWord: false,
          useRegex: false,
        });
      },
      onScrollToTop: scrollToTop,
      onRefreshRecentFiles: refreshRecentFiles,
    });

  useKeyboardShortcuts({
    handleNew: fileActions.handleNew,
    handleSave: fileActions.handleSave,
    handleSaveAs: fileActions.handleSaveAs,
    handleOpen: fileActions.handleOpen,
  });

  useMenuEvents({
    handleNew: fileActions.handleNew,
    handleOpen: fileActions.handleOpen,
    handleSave: fileActions.handleSave,
    handleSaveAs: fileActions.handleSaveAs,
    isSidebarCollapsed,
    onSidebarToggle: () => setIsSidebarCollapsed(!isSidebarCollapsed),
    handleFileOpen: fileActions.handleFileOpen,
    onPreferencesOpen: () => setIsPreferencesOpen(true),
    editorRef,
  });

  // 파일 상태에서 가져온 값들
  const { currentFileName, currentFilePath, currentEncoding, markdownText, isDirty } = fileState;

  // Electron 환경에서는 beforeunload 대신 IPC로 처리
  // 웹 환경에서만 beforeunload 사용
  useEffect(() => {
    // Electron 환경에서는 beforeunload를 사용하지 않음
    // 메인 프로세스에서 close 이벤트로 처리
    if (window.electronAPI) {
      return; // Electron 환경에서는 아무것도 하지 않음
    }

    // 웹 환경에서만 beforeunload 이벤트 사용
    const handleBeforeUnload = (e: BeforeUnloadEvent): string | undefined => {
      if (isDirty) {
        e.preventDefault();
        // Chrome에서는 returnValue를 설정해야 함
        e.returnValue = '';
        return '';
      }
      return undefined;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // isDirty 상태를 전역으로 노출 (메인 프로세스에서 접근 가능하도록)
  useEffect(() => {
    (window as typeof window & { __isDirty__?: boolean }).__isDirty__ = isDirty;
  }, [isDirty]);

  // 메모리 정리 등록
  useMemoryCleanup(() => {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
    }
    memoryManager.cleanup();
  });

  // 파일 타입에 따른 프리뷰 표시 여부 계산
  const shouldShowPreviewByFileType = useMemo(() => {
    if (currentFilePath) {
      return shouldShowPreview(currentFilePath);
    }
    return shouldShowPreview(currentFileName);
  }, [currentFilePath, currentFileName]);

  // 최종 프리뷰 표시 여부 (파일 타입 + 사용자 토글)
  const finalShowPreview = useMemo(() => {
    if (userTogglePreview !== null) {
      // 사용자가 수동으로 토글한 경우
      return userTogglePreview;
    }
    // 파일 타입에 따라 자동 결정
    return shouldShowPreviewByFileType;
  }, [userTogglePreview, shouldShowPreviewByFileType]);

  // 프리뷰 토글 핸들러
  const handlePreviewToggle = useCallback(() => {
    setUserTogglePreview((prev) => {
      if (prev === null) {
        // 처음 토글: 현재 상태의 반대로 설정
        return !finalShowPreview;
      } else {
        // 이미 토글된 상태: 반대로 설정
        return !prev;
      }
    });
  }, [finalShowPreview]);

  return (
    <div
      className={`main-layout ${isDragOver ? 'drag-over' : ''}`}
      data-testid="main-layout"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <TitleBar
        onPreviewToggle={handlePreviewToggle}
        isPreviewVisible={finalShowPreview}
        isPreviewEnabled={shouldShowPreviewByFileType}
      />
      <div className="main-content">
        <Sidebar
          ref={sidebarRef}
          currentFileName={currentFileName}
          onFileNameChange={fileActions.handleFileNameChange}
          isDirty={isDirty}
          onFileOpen={fileActions.handleFileOpen}
          onNewFile={fileActions.handleNew}
          onRefreshRecentFiles={refreshRecentFiles}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <PanelGroup direction="horizontal" className="editor-preview-group">
          <Panel
            defaultSize={LAYOUT_CONFIG.EDITOR_PREVIEW_DEFAULT_SIZE}
            minSize={LAYOUT_CONFIG.PANEL_MIN_SIZE}
            className="editor-panel"
          >
            <Editor
              ref={editorRef}
              value={markdownText}
              onCursorChange={handleCursorChange}
              onChange={fileActions.handleTextChange}
              debounceMs={EDITOR_CONFIG.DEBOUNCE_MS}
              onScroll={handleEditorScroll}
              onTextareaRef={(ref) => {
                editorTextareaRef.current = ref;
              }}
              fileName={currentFileName}
              showLineNumbers={editorSettings.showLineNumbers}
              fontFamily={editorSettings.fontFamily}
              fontSize={editorSettings.fontSize}
              onSearchStateChange={(state) => {
                setSearchQuery(state.query);
                setCurrentSearchIndex(state.currentIndex);
                setSearchOptions(state.options);
              }}
            />
          </Panel>
          {finalShowPreview && (
            <>
              <PanelResizeHandle className="resize-handle" />
              <Panel
                defaultSize={LAYOUT_CONFIG.EDITOR_PREVIEW_DEFAULT_SIZE}
                minSize={LAYOUT_CONFIG.PANEL_MIN_SIZE}
                className="preview-panel"
              >
                <Preview
                  markdown={markdownText}
                  ref={previewRef}
                  onScroll={handlePreviewScroll}
                  searchQuery={searchQuery}
                  currentSearchIndex={currentSearchIndex}
                  searchOptions={searchOptions}
                />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>
      <StatusBar
        cursorPosition={cursorPosition}
        encoding={currentEncoding}
        isDirty={isDirty}
        showStatus={showStatus}
      />
      <Preferences
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
});

MainLayout.displayName = 'MainLayout';

export default MainLayout;
