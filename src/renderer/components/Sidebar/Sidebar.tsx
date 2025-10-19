import React, {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import { getFileNameError } from '@renderer/utils/fileNameValidator';
import { FILE_CONFIG } from '@renderer/constants';
import type { SidebarProps, SidebarRef } from '@renderer/types';
import { getRecentFiles, removeRecentFile, type RecentFile } from '@renderer/utils/fileOperations';
import './Sidebar.css';
import { DEFAULT_PATH_MAX_LENGTH } from '@renderer/constants/ui';

/**
 * 경로를 단축하여 표시 (예: /Users/name/very/long/path/to/file.md → ~/very/.../file.md)
 */
/**
 * 홈 디렉토리 경로를 ~로 축약하는 헬퍼 함수
 */
function replaceHomeDirectory(path: string): string {
  const unixHomePattern = /^(\/Users\/[^/]+|\/home\/[^/]+)(\/|$)/;
  const windowsHomePattern = /^[A-Z]:\\Users\\[^\\]+\\/i;

  if (unixHomePattern.test(path)) {
    return path.replace(unixHomePattern, '~$2');
  } else if (windowsHomePattern.test(path)) {
    return path.replace(windowsHomePattern, '~\\');
  }

  return path;
}

/**
 * 경로를 구분자에 따라 분할하는 헬퍼 함수
 */
function splitPath(path: string): { separator: string; parts: string[] } {
  const separator = path.includes('\\') ? '\\' : '/';
  const parts = path.split(separator);
  return { separator, parts };
}

/**
 * 경로를 축약하는 헬퍼 함수
 */
function createShortenedPath(parts: string[], separator: string, maxLength: number): string {
  const fileName = parts[parts.length - 1];
  const lastDir = parts[parts.length - 2];
  const prefix = parts[0] || separator;

  // 중간을 생략하고 마지막 2개 부분만 표시
  const shortened = `${prefix}${separator}...${separator}${lastDir}${separator}${fileName}`;

  // 여전히 길면 파일명만 표시
  if (shortened.length > maxLength) {
    return `...${separator}${fileName}`;
  }

  return shortened;
}

function shortenPath(fullPath: string, maxLength: number = DEFAULT_PATH_MAX_LENGTH): string {
  // 1단계: 홈 디렉토리를 ~로 변경
  const path = replaceHomeDirectory(fullPath);

  // 2단계: 경로가 충분히 짧으면 그대로 반환
  if (path.length <= maxLength) {
    return path;
  }

  // 3단계: 경로를 부분으로 나누기
  const { separator, parts } = splitPath(path);

  // 4단계: 파일명과 마지막 디렉토리는 유지
  if (parts.length <= 2) {
    return path;
  }

  // 5단계: 경로 축약
  return createShortenedPath(parts, separator, maxLength);
}

const Sidebar = React.memo(
  forwardRef<SidebarRef, SidebarProps>(
    (
      {
        currentFileName = FILE_CONFIG.DEFAULT_FILENAME,
        onFileNameChange,
        isDirty = false,
        onFileOpen,
        onNewFile: _onNewFile,
        onRefreshRecentFiles,
        isCollapsed: externalIsCollapsed = false,
        onToggleCollapse,
      },
      ref
    ) => {
      const [isCollapsed, setIsCollapsed] = useState(externalIsCollapsed);
      const [isEditingFileName, setIsEditingFileName] = useState(false);
      const [editedFileName, setEditedFileName] = useState(currentFileName);
      const [fileNameError, setFileNameError] = useState<string | null>(null);
      const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
      const [selectedFile, setSelectedFile] = useState<string | null>(null);
      const inputRef = useRef<HTMLInputElement>(null);

      // 파일명이 외부에서 변경되면 동기화
      useEffect(() => {
        setEditedFileName(currentFileName);
      }, [currentFileName]);

      // 편집 모드 진입 시 입력 필드에 포커스
      useEffect(() => {
        if (isEditingFileName && inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, [isEditingFileName]);

      // 최근 파일 목록 가져오기
      useEffect(() => {
        // 컴포넌트 마운트 시에만 최근 파일 로드
        let isMounted = true;

        const loadFiles = async () => {
          try {
            const result = await getRecentFiles();
            if (isMounted && result.success && result.files) {
              setRecentFiles(result.files);
            }
          } catch (error) {
            if (isMounted) {
              setRecentFiles([]);
            }
          }
        };

        // 다음 틱에서 실행하여 테스트 환경에서 act() 경고 방지
        const timeoutId = setTimeout(() => {
          void loadFiles();
        }, 0);

        return () => {
          isMounted = false;
          clearTimeout(timeoutId);
        };
      }, []);

      const loadRecentFiles = async () => {
        const result = await getRecentFiles();
        if (result.success && result.files) {
          setRecentFiles(result.files);
        }
      };

      const handleFileNameSave = useCallback((): string | null => {
        const trimmed = editedFileName.trim();

        // 파일명 검증
        const error = getFileNameError(trimmed);
        if (error) {
          setFileNameError(error);
          return null; // 편집 모드 유지
        }

        // 유효한 파일명이고 변경되었으면 저장
        if (trimmed && trimmed !== currentFileName) {
          onFileNameChange?.(trimmed);
          setFileNameError(null);
          setIsEditingFileName(false);
          return trimmed; // 변경된 파일명 반환
        }

        setFileNameError(null);
        setIsEditingFileName(false);
        return null; // 변경 없음
      }, [editedFileName, currentFileName, onFileNameChange]);

      // 외부에서 최근 파일 목록 새로고침 및 파일명 커밋을 위한 ref 노출
      useImperativeHandle(
        ref,
        () => ({
          refreshRecentFiles: loadRecentFiles,
          commitFileName: handleFileNameSave,
        }),
        [handleFileNameSave]
      );

      const handleToggle = () => {
        const newCollapsedState = !isCollapsed;
        setIsCollapsed(newCollapsedState);
        onToggleCollapse?.();
      };

      const handleRefresh = () => {
        // 최근 문서 목록 새로고침
        void loadRecentFiles();
        onRefreshRecentFiles?.();
      };


      const handleDelete = async () => {
        // 선택된 문서 삭제
        if (selectedFile) {
          await removeRecentFile(selectedFile);
          setSelectedFile(null);
          void loadRecentFiles();
        }
      };

      const handleFileClick = (filePath: string) => {
        setSelectedFile(filePath);
        // 싱글클릭으로 파일 열기
        if (onFileOpen) {
          void onFileOpen(filePath);
        }
      };

      const handleFileNameClick = () => {
        setIsEditingFileName(true);
      };

      const handleFileNameCancel = () => {
        setEditedFileName(currentFileName);
        setFileNameError(null);
        setIsEditingFileName(false);
      };

      const handleFileNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          handleFileNameSave();
        } else if (e.key === 'Escape') {
          handleFileNameCancel();
        }
      };

      const handleFileNameBlur = () => {
        handleFileNameSave();
      };

      return (
        <aside
          className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
          data-testid="sidebar"
          role="complementary"
          aria-label="사이드바"
        >
          {/* 파일명 섹션 */}
          <div className="sidebar-filename-section">
            <div className="filename-wrapper">
              {isEditingFileName ? (
                <>
                  <input
                    ref={inputRef}
                    type="text"
                    className={`filename-input ${fileNameError ? 'filename-input-error' : ''}`}
                    value={editedFileName}
                    onChange={(e) => setEditedFileName(e.target.value)}
                    onKeyDown={handleFileNameKeyDown}
                    onBlur={handleFileNameBlur}
                    aria-invalid={!!fileNameError}
                    aria-describedby={fileNameError ? 'filename-error' : undefined}
                    aria-label="파일명 입력"
                    placeholder="파일명을 입력하세요"
                  />
                  {fileNameError && (
                    <div className="filename-error" id="filename-error" role="alert">
                      {fileNameError}
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="filename-display"
                  onClick={handleFileNameClick}
                  title="클릭하여 파일명 변경"
                  role="button"
                  tabIndex={0}
                  aria-label="파일명 변경"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleFileNameClick();
                    }
                  }}
                >
                  {currentFileName}
                  {isDirty ? ' *' : ''}
                </div>
              )}
            </div>
          </div>

          {/* 최근 문서 헤더 */}
          <div className="sidebar-header">
            <div className="sidebar-title">
              <button
                className="toggle-button"
                onClick={handleToggle}
                title="접기/펼치기"
                aria-label={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? '▶' : '▼'}
              </button>
              <h3>최근 문서 ({recentFiles.length})</h3>
            </div>
            <div className="sidebar-actions">
              <button onClick={handleRefresh} title="새로고침" aria-label="최근 문서 새로고침">
                🔄
              </button>
              <button
                onClick={() => void handleDelete()}
                title="삭제"
                aria-label="선택된 문서 삭제"
                disabled={!selectedFile}
              >
                🗑️
              </button>
            </div>
          </div>

          {/* 파일 목록 */}
          {!isCollapsed && (
            <div className="sidebar-content" data-testid="file-list">
              {recentFiles.length === 0 ? (
                <div className="empty-state">
                  <p>최근 문서가 없습니다</p>
                </div>
              ) : (
                <ul className="file-list">
                  {recentFiles.map((file) => {
                    // displayName이 있으면 사용, 없으면 경로에서 파일명 추출
                    const fileName = file.displayName || file.path.split('/').pop() || file.path;
                    const isSelected = selectedFile === file.path;
                    const shortPath = shortenPath(file.path);

                    return (
                      <li
                        key={file.path}
                        className={`file-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleFileClick(file.path)}
                        title={file.path}
                      >
                        <div className="file-name">{fileName}</div>
                        <div className="file-path">{shortPath}</div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </aside>
      );
    }
  )
);

Sidebar.displayName = 'Sidebar';

export default Sidebar;
