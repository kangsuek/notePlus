import React, { useState, useCallback, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import LineNumbers from './LineNumbers';
import SearchBar from '../SearchBar/SearchBar';
import { EDITOR_CONFIG, MARKDOWN_SYNTAX } from '@renderer/constants';
import type { EditorProps, EditorRef } from '@renderer/types';
import { calculateLineWraps } from '@renderer/utils/lineWrapCalculator';
import { calculateExpression } from '@renderer/utils/calculateExpression';
import {
  parseMarkdownList,
  isEmptyListItem,
  generateNextListItem,
  removeEmptyListItem,
} from '@renderer/utils/markdownListUtils';
import {
  searchText,
  replaceAtIndex,
  replaceAll,
  getNextResultIndex,
  getPreviousResultIndex,
  type SearchResult,
  type SearchOptions,
} from '@renderer/utils/searchUtils';
import './Editor.css';

const Editor = React.memo(
  forwardRef<EditorRef, EditorProps>(({
    value: controlledValue,
    onChange,
    onCursorChange,
    debounceMs = 0,
    onScroll,
    onTextareaRef,
    fileName,
    showLineNumbers = true,
    fontFamily = 'Monaco, Menlo, "Courier New", monospace',
    fontSize = 14,
    onSearchStateChange,
  }, ref) => {
    const [text, setText] = useState(controlledValue || '');
    const [currentLine, setCurrentLine] = useState(1);
    const [viewportWidth, setViewportWidth] = useState(0); // 뷰포트 너비 추적
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const highlightContentRef = useRef<HTMLDivElement>(null);

    // Search state
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
    const [currentSearchQuery, setCurrentSearchQuery] = useState('');
    const [currentSearchOptions, setCurrentSearchOptions] = useState<SearchOptions>({
      caseSensitive: false,
      wholeWord: false,
      useRegex: false,
    });
    const [initialSearchQuery, setInitialSearchQuery] = useState('');

    // Get selected text from textarea
    const getSelectedText = useCallback(() => {
      if (!textareaRef.current) return '';
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      if (start === end) return ''; // No selection
      return text.substring(start, end);
    }, [text]);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      openSearch: () => {
        const selectedText = getSelectedText();
        if (selectedText) {
          setInitialSearchQuery(selectedText);
        } else {
          setInitialSearchQuery('');
        }
        setIsSearchVisible(true);
      },
      openReplace: () => {
        const selectedText = getSelectedText();
        if (selectedText) {
          setInitialSearchQuery(selectedText);
        } else {
          setInitialSearchQuery('');
        }
        setIsSearchVisible(true);
      },
    }), [getSelectedText]);

    // 자동 줄바꿈 정보 계산 (useMemo로 메모이제이션)
    const lineWraps = useMemo(() => {
      // textarea가 없거나 viewportWidth가 0이면 기본값 반환
      if (!textareaRef.current || viewportWidth === 0) {
        const lines = text.split('\n');
        return lines.map((_, index) => ({
          logicalLineNumber: index + 1,
          isWrapped: false,
        }));
      }

      // 텍스트가 비어있으면 빈 배열 반환
      if (!text.trim()) {
        return [];
      }

      return calculateLineWraps(text, textareaRef.current);
    }, [text, viewportWidth]);

    // 커서 위치 계산
    const updateCursorPosition = useCallback(() => {
      if (!textareaRef.current) return;

      const textarea = textareaRef.current;
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = text.substring(0, cursorPos);
      const lines = textBeforeCursor.split('\n');
      const line = lines.length;
      const lastLine = lines[lines.length - 1];
      const column = lastLine ? lastLine.length + 1 : 1;

      setCurrentLine(line);

      if (onCursorChange) {
        onCursorChange({ line, column });
      }
    }, [text, onCursorChange]);

    // 텍스트 변경 핸들러 (디바운싱 적용)
    const handleTextChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setText(newValue);

        if (onChange) {
          if (debounceMs > 0) {
            // 디바운싱: 이전 타이머 취소
            if (debounceTimerRef.current) {
              clearTimeout(debounceTimerRef.current);
            }
            // 새 타이머 설정
            debounceTimerRef.current = setTimeout(() => {
              onChange(newValue);
            }, debounceMs);
          } else {
            // 디바운싱 없이 즉시 호출
            onChange(newValue);
          }
        }
      },
      [onChange, debounceMs]
    );

    // Sync highlight layer scroll with textarea
    const syncHighlightScroll = useCallback(() => {
      if (highlightContentRef.current && textareaRef.current) {
        highlightContentRef.current.style.transform =
          `translate(-${textareaRef.current.scrollLeft}px, -${textareaRef.current.scrollTop}px)`;
      }
    }, []);

    // 스크롤 동기화 핸들러
    const handleScroll = useCallback(
      (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (!textareaRef.current) return;

        // textarea의 스크롤을 line numbers에 동기화
        if (lineNumbersRef.current) {
          lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }

        // textarea의 스크롤을 highlight layer에 동기화
        syncHighlightScroll();

        // 부모 컴포넌트에 스크롤 이벤트 전달 (Editor ↔ Preview 동기화)
        if (onScroll) {
          onScroll(e);
        }
      },
      [onScroll, syncHighlightScroll]
    );

    // 클릭 또는 키보드 이벤트 시 커서 위치 업데이트
    const handleCursorUpdate = useCallback(() => {
      updateCursorPosition();
    }, [updateCursorPosition]);

    // Tab 키 처리: 단일 커서는 스페이스 삽입, 여러 줄 선택은 블록 들여쓰기
    const handleTab = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>, isShiftTab = false) => {
        e.preventDefault();
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const spaces = ' '.repeat(EDITOR_CONFIG.TAB_SIZE);

        // 단일 커서 위치 (선택 영역 없음)
        if (start === end) {
          if (isShiftTab) {
            // Shift+Tab: 현재 줄의 들여쓰기 해제
            const textBeforeCursor = text.substring(0, start);
            const lines = textBeforeCursor.split('\n');
            const currentLineStart = textBeforeCursor.length - (lines[lines.length - 1]?.length || 0);
            const nextNewlinePos = text.indexOf('\n', end);
            const currentLineEnd = nextNewlinePos === -1 ? text.length : nextNewlinePos;
            const currentLineText = text.substring(currentLineStart, currentLineEnd);

            // 줄 앞의 공백 개수 계산 (최대 TAB_SIZE만큼)
            const leadingSpaces = currentLineText.match(/^ {1,4}/)?.[0] || '';
            if (leadingSpaces.length === 0) return;

            const newLineText = currentLineText.substring(leadingSpaces.length);
            const newValue =
              text.substring(0, currentLineStart) + newLineText + text.substring(currentLineEnd);
            setText(newValue);

            // 커서 위치 조정
            setTimeout(() => {
              const newCursorPos = Math.max(currentLineStart, start - leadingSpaces.length);
              textarea.selectionStart = textarea.selectionEnd = newCursorPos;
              updateCursorPosition();
            }, 0);

            if (onChange) {
              onChange(newValue);
            }
          } else {
            // Tab: 스페이스 삽입
            const newValue = text.substring(0, start) + spaces + text.substring(end);
            setText(newValue);

            // 커서 위치 조정
            setTimeout(() => {
              textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
              updateCursorPosition();
            }, 0);

            if (onChange) {
              onChange(newValue);
            }
          }
        } else {
          // 여러 줄 선택: 블록 들여쓰기/해제
          const selectedText = text.substring(start, end);
          const textBeforeSelection = text.substring(0, start);
          const textAfterSelection = text.substring(end);

          // 선택 영역의 시작과 끝 줄 찾기
          const linesBeforeSelection = textBeforeSelection.split('\n');
          const firstLineStart =
            textBeforeSelection.length - (linesBeforeSelection[linesBeforeSelection.length - 1]?.length || 0);

          // 선택 영역 포함 전체 줄 추출
          const fullSelectionEnd = text.indexOf('\n', end);
          const lastLineEnd = fullSelectionEnd === -1 ? text.length : fullSelectionEnd;
          const fullSelectedText = text.substring(firstLineStart, lastLineEnd);
          const lines = fullSelectedText.split('\n');

          let newLines: string[];
          if (isShiftTab) {
            // Shift+Tab: 각 줄의 들여쓰기 해제 (최대 TAB_SIZE만큼)
            newLines = lines.map((line) => {
              const leadingSpaces = line.match(/^ {1,4}/)?.[0] || '';
              return leadingSpaces.length > 0 ? line.substring(leadingSpaces.length) : line;
            });
          } else {
            // Tab: 각 줄에 들여쓰기 추가
            newLines = lines.map((line) => spaces + line);
          }

          const newSelectedText = newLines.join('\n');
          const newValue = text.substring(0, firstLineStart) + newSelectedText + text.substring(lastLineEnd);
          setText(newValue);

          // 선택 영역 유지
          setTimeout(() => {
            textarea.selectionStart = firstLineStart;
            textarea.selectionEnd = firstLineStart + newSelectedText.length;
            updateCursorPosition();
          }, 0);

          if (onChange) {
            onChange(newValue);
          }
        }
      },
      [text, onChange, updateCursorPosition]
    );

    // Enter 키 처리: 마크다운 목록 자동 생성 또는 들여쓰기 유지
    const handleEnter = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const textBeforeEnter = text.substring(0, start);
        const lines = textBeforeEnter.split('\n');
        const currentLineText = lines[lines.length - 1] || '';

        // 마크다운 파일인지 확인
        const isMarkdown =
          fileName?.endsWith('.md') || fileName?.endsWith('.markdown') || !fileName;

        if (isMarkdown) {
          // 마크다운 모드: 목록 자동 생성
          const pattern = parseMarkdownList(currentLineText);

          if (pattern.type !== 'none') {
            e.preventDefault();

            // 빈 목록 항목 → 목록 종료
            if (isEmptyListItem(pattern)) {

              // 현재 줄의 시작과 끝 위치 계산
              const currentLineStart = textBeforeEnter.length - currentLineText.length;
              const nextNewlinePos = text.indexOf('\n', end);
              const currentLineEnd = nextNewlinePos === -1 ? text.length : nextNewlinePos;

              // 빈 목록 항목 제거하고 개행 추가
              const { newText, cursorPos } = removeEmptyListItem(
                text,
                currentLineStart,
                currentLineEnd
              );

              // 개행 문자 추가
              const finalText = newText.substring(0, cursorPos) + '\n' + newText.substring(cursorPos);

              setText(finalText);

              setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = cursorPos + 1;
                updateCursorPosition();
              }, 0);

              if (onChange) {
                onChange(finalText);
              }
              return;
            }

            // 다음 목록 항목 생성
            const nextItem = generateNextListItem(pattern);
            const newValue = text.substring(0, start) + nextItem + text.substring(end);

            setText(newValue);

            setTimeout(() => {
              const newCursorPos = start + nextItem.length;
              textarea.selectionStart = textarea.selectionEnd = newCursorPos;
              updateCursorPosition();
            }, 0);

            if (onChange) {
              onChange(newValue);
            }
            return;
          }
        }

        // 기본 모드: 들여쓰기만 유지
        const indentMatch = currentLineText.match(/^(\s+)/);
        const indent = indentMatch?.[1] || '';

        if (indent && indent.length > 0) {
          e.preventDefault();
          const newValue = text.substring(0, start) + '\n' + indent + text.substring(end);
          setText(newValue);

          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length;
            updateCursorPosition();
          }, 0);

          if (onChange) {
            onChange(newValue);
          }
        }
      },
      [text, onChange, updateCursorPosition, fileName]
    );

    // 단축키 처리: Cmd+B, Cmd+I, Cmd+K
    const handleShortcut = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = text.substring(start, end);
        let newValue = text;
        let newCursorPos = start;

        // Cmd+B: Bold
        if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
          e.preventDefault();
          const wrapper = MARKDOWN_SYNTAX.BOLD;
          newValue =
            text.substring(0, start) + wrapper + selectedText + wrapper + text.substring(end);
          newCursorPos = selectedText ? end + wrapper.length * 2 : start + wrapper.length;
        }
        // Cmd+I: Italic
        else if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
          e.preventDefault();
          const wrapper = MARKDOWN_SYNTAX.ITALIC;
          newValue =
            text.substring(0, start) + wrapper + selectedText + wrapper + text.substring(end);
          newCursorPos = selectedText ? end + wrapper.length * 2 : start + wrapper.length;
        }
        // Cmd+K: Link
        else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          const linkText = selectedText || 'text';
          const linkMarkdown = MARKDOWN_SYNTAX.LINK_TEMPLATE.replace('text', linkText);
          newValue = text.substring(0, start) + linkMarkdown + text.substring(end);
          newCursorPos = start + linkMarkdown.length;
        }
        // Cmd+/: 주석 (HTML 주석)
        else if ((e.metaKey || e.ctrlKey) && e.key === '/') {
          e.preventDefault();
          if (selectedText) {
            // 선택된 텍스트를 주석으로 감싸기
            const comment = `<!-- ${selectedText} -->`;
            newValue = text.substring(0, start) + comment + text.substring(end);
            newCursorPos = start + comment.length;
          } else {
            // 현재 줄을 주석 처리
            const textBeforeStart = text.substring(0, start);
            const lines = textBeforeStart.split('\n');
            const lastLine = lines[lines.length - 1];
            const currentLineStart = textBeforeStart.length - (lastLine?.length || 0);
            const nextNewlinePos = text.indexOf('\n', end);
            const currentLineEnd = nextNewlinePos === -1 ? text.length : nextNewlinePos;
            const currentLineText = text.substring(currentLineStart, currentLineEnd);

            const comment = `<!-- ${currentLineText} -->`;
            newValue =
              text.substring(0, currentLineStart) + comment + text.substring(currentLineEnd);
            newCursorPos = currentLineStart + comment.length;
          }
        } else {
          return; // 단축키가 아니면 아무것도 하지 않음
        }

        setText(newValue);

        // 커서 위치 조정
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = newCursorPos;
          updateCursorPosition();
        }, 0);

        // onChange 호출
        if (onChange) {
          onChange(newValue);
        }
      },
      [text, onChange, updateCursorPosition]
    );

    // = 키 처리: 수식 계산
    const handleEquals = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const textBeforeCursor = text.substring(0, start);
        const lines = textBeforeCursor.split('\n');
        const currentLineText = lines[lines.length - 1] || '';

        // 현재 줄이 비어있으면 계산하지 않음
        if (!currentLineText.trim()) {
          return;
        }

        // 이미 = 가 있으면 계산하지 않음
        if (currentLineText.includes('=')) {
          return;
        }

        // 수식 계산
        const result = calculateExpression(currentLineText.trim());

        // 에러가 발생한 경우 아무것도 하지 않음 (= 키만 입력되도록)
        if (result.startsWith('Error:')) {
          return;
        }

        e.preventDefault();

        // 계산 결과를 현재 줄 끝에 추가
        const newValue = text.substring(0, start) + ' = ' + result + text.substring(start);

        setText(newValue);

        // 커서 위치를 결과 뒤로 이동
        setTimeout(() => {
          const newCursorPos = start + 3 + result.length;
          textarea.selectionStart = textarea.selectionEnd = newCursorPos;
          updateCursorPosition();
        }, 0);

        // onChange 호출
        if (onChange) {
          onChange(newValue);
        }
      },
      [text, onChange, updateCursorPosition]
    );

    // 키보드 이벤트 통합 핸들러
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Cmd+F: Open search
        if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
          e.preventDefault();
          const selectedText = getSelectedText();
          if (selectedText) {
            setInitialSearchQuery(selectedText);
          } else {
            setInitialSearchQuery('');
          }
          setIsSearchVisible(true);
          return;
        }

        // Cmd+H: Open search with replace
        if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
          e.preventDefault();
          const selectedText = getSelectedText();
          if (selectedText) {
            setInitialSearchQuery(selectedText);
          } else {
            setInitialSearchQuery('');
          }
          setIsSearchVisible(true);
          return;
        }

        if (e.key === 'Tab') {
          handleTab(e, e.shiftKey);
        } else if (e.key === 'Enter') {
          handleEnter(e);
        } else if (e.key === '=') {
          handleEquals(e);
        } else {
          handleShortcut(e);
        }
      },
      [handleTab, handleEnter, handleEquals, handleShortcut, getSelectedText]
    );

    // Scroll textarea to make the search result visible (centered in viewport)
    const scrollToSearchResult = useCallback((start: number) => {
      if (!textareaRef.current) return;

      const textarea = textareaRef.current;

      // Use a temporary div to measure exact text position
      const measureDiv = document.createElement('div');
      const style = window.getComputedStyle(textarea);

      // Copy all relevant styles from textarea
      measureDiv.style.cssText = `
        position: absolute;
        visibility: hidden;
        width: ${textarea.clientWidth}px;
        font-family: ${style.fontFamily};
        font-size: ${style.fontSize};
        line-height: ${style.lineHeight};
        padding: ${style.padding};
        white-space: pre-wrap;
        word-wrap: break-word;
        overflow-wrap: break-word;
      `;

      document.body.appendChild(measureDiv);

      // Measure the height of text before selection
      const textBeforeSelection = text.substring(0, start);
      measureDiv.textContent = textBeforeSelection;
      const offsetTop = measureDiv.offsetHeight;

      // Clean up
      document.body.removeChild(measureDiv);

      // Calculate scroll position to center the selection
      const viewportHeight = textarea.clientHeight;
      const targetScroll = offsetTop - viewportHeight / 2;

      // Smooth scroll to center position
      textarea.scrollTop = Math.max(0, targetScroll);
    }, [text]);

    // Notify parent about search state changes
    useEffect(() => {
      if (onSearchStateChange) {
        onSearchStateChange({
          query: currentSearchQuery,
          currentIndex: currentSearchIndex,
          options: currentSearchOptions,
        });
      }
    }, [currentSearchQuery, currentSearchIndex, currentSearchOptions, onSearchStateChange]);

    // Search handlers
    const handleSearch = useCallback(
      (query: string, options: SearchOptions) => {
        const results = searchText(text, query, options);
        setSearchResults(results);
        setCurrentSearchIndex(results.length > 0 ? 0 : -1);
        setCurrentSearchQuery(query);
        setCurrentSearchOptions(options);

        // Scroll to first result (no focus change)
        if (results.length > 0 && textareaRef.current) {
          scrollToSearchResult(results[0].index);
        }
      },
      [text, scrollToSearchResult]
    );

    const handleNextMatch = useCallback(() => {
      if (searchResults.length === 0) return;

      const nextIndex = getNextResultIndex(currentSearchIndex, searchResults.length);
      setCurrentSearchIndex(nextIndex);

      // Scroll to result (no focus change)
      if (nextIndex >= 0 && textareaRef.current) {
        const result = searchResults[nextIndex];
        scrollToSearchResult(result.index);
      }
    }, [searchResults, currentSearchIndex, scrollToSearchResult]);

    const handlePreviousMatch = useCallback(() => {
      if (searchResults.length === 0) return;

      const prevIndex = getPreviousResultIndex(currentSearchIndex, searchResults.length);
      setCurrentSearchIndex(prevIndex);

      // Scroll to result (no focus change)
      if (prevIndex >= 0 && textareaRef.current) {
        const result = searchResults[prevIndex];
        scrollToSearchResult(result.index);
      }
    }, [searchResults, currentSearchIndex, scrollToSearchResult]);

    const handleReplace = useCallback(
      (replacement: string) => {
        if (currentSearchIndex < 0 || currentSearchIndex >= searchResults.length) return;

        const result = searchResults[currentSearchIndex];
        const newText = replaceAtIndex(text, result.index, result.length, replacement);

        setText(newText);
        if (onChange) {
          onChange(newText);
        }

        // Re-search to update highlights for remaining matches
        setTimeout(() => {
          const newResults = searchText(newText, currentSearchQuery, currentSearchOptions);
          setSearchResults(newResults);

          // Move to the next match, or stay at the same position if possible
          if (newResults.length > 0) {
            const nextIndex = currentSearchIndex < newResults.length ? currentSearchIndex : 0;
            setCurrentSearchIndex(nextIndex);

            // Scroll to the next result
            if (textareaRef.current) {
              scrollToSearchResult(newResults[nextIndex].index);
            }
          } else {
            setCurrentSearchIndex(-1);
          }
        }, 0);
      },
      [text, searchResults, currentSearchIndex, currentSearchQuery, currentSearchOptions, onChange, scrollToSearchResult]
    );

    const handleReplaceAll = useCallback(
      (replacement: string) => {
        if (searchResults.length === 0) return;

        // Use current search query and options
        const { newText, count } = replaceAll(text, currentSearchQuery, replacement, currentSearchOptions);

        setText(newText);
        if (onChange) {
          onChange(newText);
        }

        // Clear search results after replace all
        setSearchResults([]);
        setCurrentSearchIndex(-1);
      },
      [text, currentSearchQuery, currentSearchOptions, searchResults.length, onChange]
    );

    const handleCloseSearch = useCallback(() => {
      setIsSearchVisible(false);
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      setCurrentSearchQuery('');
      setInitialSearchQuery('');

      // Return focus to textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, []);

    // 클린업: 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

    // 외부에서 value가 변경되면 내부 상태 업데이트 및 검색 상태 초기화
    useEffect(() => {
      if (controlledValue !== undefined && controlledValue !== text) {
        setText(controlledValue);

        // 텍스트가 완전히 바뀐 경우 (새 파일 열기 등) 검색 상태 초기화
        // 단, 사용자가 직접 편집하는 경우는 제외 (debounce를 통해 onChange가 호출되는 경우)
        if (controlledValue === '' || Math.abs(controlledValue.length - text.length) > 100) {
          setSearchResults([]);
          setCurrentSearchIndex(-1);
          setCurrentSearchQuery('');
          setIsSearchVisible(false);
        }
      }
    }, [controlledValue, text]);

    // 윈도우 크기 변경 감지 (자동 줄바꿈 재계산)
    useEffect(() => {
      const handleResize = () => {
        if (textareaRef.current) {
          // requestAnimationFrame을 사용하여 DOM 업데이트 후 실행
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              setViewportWidth(textareaRef.current.clientWidth);
            }
          });
        }
      };

      // 초기 너비 설정
      handleResize();

      // ResizeObserver로 textarea 크기 변경 감지
      const resizeObserver = new ResizeObserver(handleResize);
      if (textareaRef.current) {
        resizeObserver.observe(textareaRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }, []);

    // textarea ref를 부모 컴포넌트에 전달 (스크롤 동기화용)
    useEffect(() => {
      if (onTextareaRef) {
        onTextareaRef(textareaRef.current);
      }
    }, [onTextareaRef]);

    // Sync highlight layer dimensions and scroll position with textarea
    useEffect(() => {
      if (highlightContentRef.current && textareaRef.current) {
        // Match the textarea's content width (clientWidth accounts for scrollbar)
        highlightContentRef.current.style.width = `${textareaRef.current.clientWidth}px`;

        // Sync scroll position
        syncHighlightScroll();
      }
    }, [searchResults, currentSearchIndex, viewportWidth, syncHighlightScroll]);

    // Render highlighted text for search results
    const renderHighlightedText = useCallback(() => {
      if (searchResults.length === 0 || !text) return null;

      const parts: React.ReactNode[] = [];
      let lastIndex = 0;

      searchResults.forEach((result, idx) => {
        // Add text before this match
        if (result.index > lastIndex) {
          parts.push(
            <span key={`text-${lastIndex}`}>
              {text.substring(lastIndex, result.index)}
            </span>
          );
        }

        // Add highlighted match
        const isCurrent = idx === currentSearchIndex;
        parts.push(
          <span
            key={`match-${result.index}`}
            className={isCurrent ? 'editor-highlight-current' : 'editor-highlight'}
          >
            {text.substring(result.index, result.index + result.length)}
          </span>
        );

        lastIndex = result.index + result.length;
      });

      // Add remaining text
      if (lastIndex < text.length) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex)}
          </span>
        );
      }

      return parts;
    }, [text, searchResults, currentSearchIndex]);

    // 폰트 설정을 위한 CSS 변수 생성
    const editorStyle = {
      '--editor-font-family': fontFamily,
      '--editor-font-size': `${fontSize}px`,
    } as React.CSSProperties;

    return (
      <div className="editor-section" data-testid="editor-section" style={editorStyle}>
        <div className="editor-header">
          <h3>Editor</h3>
        </div>
        {isSearchVisible && (
          <SearchBar
            onSearch={handleSearch}
            onReplace={handleReplace}
            onReplaceAll={handleReplaceAll}
            onNext={handleNextMatch}
            onPrevious={handlePreviousMatch}
            onClose={handleCloseSearch}
            currentIndex={currentSearchIndex}
            totalResults={searchResults.length}
            isVisible={isSearchVisible}
            initialQuery={initialSearchQuery}
          />
        )}
        <div className="editor-container">
          {showLineNumbers && (
            <div ref={lineNumbersRef} className="line-numbers-wrapper">
              <LineNumbers lineWraps={lineWraps} currentLine={currentLine} />
            </div>
          )}
          <div className="editor-textarea-wrapper">
            {/* Highlight layer for search results */}
            {searchResults.length > 0 && (
              <div className="editor-highlight-layer">
                <div ref={highlightContentRef} className="editor-highlight-content">
                  {renderHighlightedText()}
                </div>
              </div>
            )}
            <textarea
              ref={textareaRef}
              className="editor-textarea"
              placeholder="마크다운으로 작성하세요..."
              value={text}
              onChange={handleTextChange}
              onScroll={handleScroll}
              onClick={handleCursorUpdate}
              onKeyUp={handleCursorUpdate}
              onKeyDown={handleKeyDown}
              aria-label="마크다운 편집기"
              aria-multiline="true"
              role="textbox"
              spellCheck="true"
            />
          </div>
        </div>
      </div>
    );
  })
);

Editor.displayName = 'Editor';

export default Editor;
