import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import TitleBar from '../TitleBar/TitleBar';
import Sidebar from '../Sidebar/Sidebar';
import Editor from '../Editor/Editor';
import Preview from '../Preview/Preview';
import StatusBar from '../StatusBar/StatusBar';
import Preferences from '../Preferences/Preferences';
import {
  UI_CONFIG,
  FILE_CONFIG,
  EDITOR_CONFIG,
  PERFORMANCE_CONFIG,
  LAYOUT_CONFIG,
} from '@renderer/constants';
import type { CursorPosition, SidebarRef, EditorRef } from '@renderer/types';
import { rafThrottle } from '@renderer/utils/throttle';
import { saveFile, saveFileAs, openFile, readFile } from '@renderer/utils/fileOperations';
import { shouldShowPreview } from '@renderer/utils/fileUtils';
import { memoryManager, useMemoryCleanup } from '@renderer/utils/memoryManager';
import './MainLayout.css';

const MainLayout: React.FC = React.memo(() => {
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ line: 1, column: 1 });
  const [isDirty, setIsDirty] = useState(false);
  const [currentFileName, setCurrentFileName] = useState<string>(FILE_CONFIG.DEFAULT_FILENAME);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [currentEncoding, setCurrentEncoding] = useState<string>('UTF-8'); // 현재 파일 인코딩
  const [showStatus, setShowStatus] = useState(false);
  const [markdownText, setMarkdownText] = useState(''); // 마크다운 텍스트 상태
  const [userTogglePreview, setUserTogglePreview] = useState<boolean | null>(null); // 사용자 토글 상태
  const [isDragOver, setIsDragOver] = useState(false); // 드래그 오버 상태
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // 사이드바 접기 상태
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false); // 설정 창 열림 상태
  const [editorSettings, setEditorSettings] = useState({
    showLineNumbers: true,
    fontFamily: 'Monaco, Menlo, "Courier New", monospace',
    fontSize: 14,
  });

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

  // 스크롤 동기화를 위한 ref
  const editorTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const sidebarRef = useRef<SidebarRef | null>(null);
  const editorRef = useRef<EditorRef | null>(null);
  const isEditorScrolling = useRef(false);
  const isPreviewScrolling = useRef(false);

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

  const handleTextChange = useCallback(
    (text: string) => {
      setMarkdownText(text); // 텍스트 상태 업데이트
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

  // 파일 저장 (Cmd+S)
  const handleSave = useCallback(async () => {
    // 편집 중인 파일명이 있다면 먼저 저장
    let newFileName = currentFileName;
    if (sidebarRef.current) {
      const committedName = sidebarRef.current.commitFileName();
      if (committedName) {
        newFileName = committedName;
      }
    }

    if (currentFilePath) {
      // 파일명이 변경되었는지 확인
      const currentPathFileName = currentFilePath.split('/').pop() || '';
      const hasFileNameChanged = newFileName !== currentPathFileName;

      if (hasFileNameChanged) {
        // 파일명이 변경된 경우 - 새로운 경로로 저장
        const directory = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));
        const newFilePath = `${directory}/${newFileName}`;

        const result = await saveFile(newFilePath, markdownText, currentEncoding);
        if (result.success) {
          setCurrentFilePath(newFilePath);
          setIsDirty(false);
          showStatusTemporarily();

          // 프리뷰 표시 여부 업데이트
          setUserTogglePreview(null);

          // 최근 파일 목록 새로고침
          refreshRecentFiles();
        } else {
          console.error('Failed to save file:', result.error);
        }
      } else {
        // 기존 파일에 저장
        const result = await saveFile(currentFilePath, markdownText, currentEncoding);
        if (result.success) {
          setIsDirty(false);
          showStatusTemporarily();

          // 최근 파일 목록 새로고침
          refreshRecentFiles();
        } else {
          console.error('Failed to save file:', result.error);
        }
      }
    } else {
      // 새 파일 - Save As
      const result = await saveFileAs(markdownText, newFileName, currentEncoding);
      if (result.success && result.filePath) {
        setCurrentFilePath(result.filePath);
        const fileName = result.filePath.split('/').pop() || FILE_CONFIG.DEFAULT_FILENAME;
        setCurrentFileName(fileName);
        setIsDirty(false);
        showStatusTemporarily();

        // 프리뷰 표시 여부 업데이트
        setUserTogglePreview(null);

        // 최근 파일 목록 새로고침
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
  ]);

  // 파일 열기 (Cmd+O)
  const handleOpen = useCallback(async () => {
    const result = await openFile();
    if (result.success && result.content && result.filePath) {
      setMarkdownText(result.content);
      setCurrentFilePath(result.filePath);
      const fileName = result.filePath.split('/').pop() || FILE_CONFIG.DEFAULT_FILENAME;
      setCurrentFileName(fileName);
      setCurrentEncoding(result.encoding || 'UTF-8');
      setIsDirty(false);

      // 파일을 열 때 사용자 토글 상태 리셋 (파일 타입에 따라 자동 결정)
      setUserTogglePreview(null);

      // 검색 상태 초기화
      setSearchQuery('');
      setCurrentSearchIndex(-1);
      setSearchOptions({
        caseSensitive: false,
        wholeWord: false,
        useRegex: false,
      });

      // 스크롤을 맨 위로 이동
      setTimeout(() => {
        if (editorTextareaRef.current) {
          editorTextareaRef.current.scrollTop = 0;
        }
        if (previewRef.current) {
          previewRef.current.scrollTop = 0;
        }
      }, PERFORMANCE_CONFIG.DOM_UPDATE_DELAY); // DOM 업데이트 후 실행

      // 최근 파일 목록 새로고침
      refreshRecentFiles();
    }
  }, [refreshRecentFiles]);

  // 드래그 앤 드롭 핸들러들
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
            setMarkdownText(content);
            setCurrentFilePath(file.name); // 파일명을 경로로 사용
            setCurrentFileName(file.name);
            setIsDirty(false);

            // 파일을 열 때 사용자 토글 상태 리셋 (파일 타입에 따라 자동 결정)
            setUserTogglePreview(null);

            // 검색 상태 초기화
            setSearchQuery('');
            setCurrentSearchIndex(-1);
            setSearchOptions({
              caseSensitive: false,
              wholeWord: false,
              useRegex: false,
            });

            // 스크롤을 맨 위로 이동
            setTimeout(() => {
              if (editorTextareaRef.current) {
                editorTextareaRef.current.scrollTop = 0;
              }
              if (previewRef.current) {
                previewRef.current.scrollTop = 0;
              }
            }, PERFORMANCE_CONFIG.DOM_UPDATE_DELAY);

            // 최근 파일 목록에 추가 (드래그 앤 드롭으로 열린 파일도 포함)
            // 드래그 앤 드롭 파일은 고유한 식별자로 관리 (파일명 + 타임스탬프)
            if (window.electronAPI) {
              try {
                const uniqueId = `dropped:${file.name}:${Date.now()}`;
                await window.electronAPI.invoke('recentFiles:add', uniqueId);
              } catch (error) {
                console.warn('Failed to add file to recent files:', error);
              }
            }

            // 최근 파일 목록 새로고침
            refreshRecentFiles();
          }
        };
        reader.readAsText(file);
      } catch (error) {
        console.error('Failed to read dropped file:', error);
      }
    },
    [refreshRecentFiles]
  );

  // 최근 파일에서 파일 열기 (Sidebar에서 더블클릭)
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

        // 파일을 열 때 사용자 토글 상태 리셋 (파일 타입에 따라 자동 결정)
        setUserTogglePreview(null);

        // 검색 상태 초기화
        setSearchQuery('');
        setCurrentSearchIndex(-1);
        setSearchOptions({
          caseSensitive: false,
          wholeWord: false,
          useRegex: false,
        });

        // 스크롤을 맨 위로 이동
        setTimeout(() => {
          if (editorTextareaRef.current) {
            editorTextareaRef.current.scrollTop = 0;
          }
          if (previewRef.current) {
            previewRef.current.scrollTop = 0;
          }
        }, PERFORMANCE_CONFIG.DOM_UPDATE_DELAY); // DOM 업데이트 후 실행

        // 최근 파일 목록 새로고침
        refreshRecentFiles();
      } else {
        console.error('Failed to open file:', result.error);
      }
    },
    [refreshRecentFiles]
  );

  // 새 파일 생성 (Cmd+N)
  const handleNew = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm('저장하지 않은 변경사항이 있습니다. 계속하시겠습니까?');
      if (!confirmed) return;
    }

    setMarkdownText('');
    setCurrentFilePath(null);
    setCurrentFileName(FILE_CONFIG.DEFAULT_FILENAME);
    setIsDirty(false);

    // 새 파일을 만들 때 사용자 토글 상태 리셋 (기본 파일명은 .md이므로 프리뷰 표시)
    setUserTogglePreview(null);

    // 검색 상태 초기화
    setSearchQuery('');
    setCurrentSearchIndex(-1);
    setSearchOptions({
      caseSensitive: false,
      wholeWord: false,
      useRegex: false,
    });
  }, [isDirty]);

  // 다른 이름으로 저장 (Cmd+Shift+S)
  const handleSaveAs = useCallback(async () => {
    // 편집 중인 파일명이 있다면 먼저 저장
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

      // 저장된 파일에 따라 사용자 토글 상태 리셋 (파일 타입에 따라 자동 결정)
      setUserTogglePreview(null);
    }
  }, [markdownText, currentFileName, currentEncoding, showStatusTemporarily]);

  // 키보드 단축키 처리
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

  // 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      if (!window.electronAPI) return;

      try {
        const result = (await window.electronAPI.invoke('settings:get')) as {
          success: boolean;
          settings?: any;
        };
        if (result.success && result.settings) {
          setEditorSettings(result.settings);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  // 메뉴 이벤트 리스너 (IPC)
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
      setIsSidebarCollapsed(!isSidebarCollapsed);
    });

    // 메뉴 → 최근 문서 열기
    window.electronAPI.on('menu:open-recent-file', (...args: unknown[]) => {
      const filePath = args[0] as string;
      handleFileOpen(filePath);
    });

    // 메뉴 → 환경설정
    window.electronAPI.on('menu:preferences', () => {
      setIsPreferencesOpen(true);
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
  }, [handleNew, handleOpen, handleSave, handleSaveAs, isSidebarCollapsed, handleFileOpen]);

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
    (window as any).__isDirty__ = isDirty;
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
      <TitleBar onPreviewToggle={handlePreviewToggle} isPreviewVisible={finalShowPreview} />
      <div className="main-content">
        <Sidebar
          ref={sidebarRef}
          currentFileName={currentFileName}
          onFileNameChange={handleFileNameChange}
          isDirty={isDirty}
          onFileOpen={handleFileOpen}
          onNewFile={handleNew}
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
              onChange={handleTextChange}
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
        onSettingsChange={(newSettings) => setEditorSettings(newSettings)}
      />
    </div>
  );
});

MainLayout.displayName = 'MainLayout';

export default MainLayout;
