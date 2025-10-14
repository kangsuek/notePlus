import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import LineNumbers from './LineNumbers';
import { EDITOR_CONFIG, MARKDOWN_SYNTAX } from '@renderer/constants';
import type { EditorProps } from '@renderer/types';
import { calculateLineWraps } from '@renderer/utils/lineWrapCalculator';
import { calculateExpression } from '@renderer/utils/calculateExpression';
import {
  parseMarkdownList,
  isEmptyListItem,
  generateNextListItem,
  removeEmptyListItem,
} from '@renderer/utils/markdownListUtils';
import './Editor.css';

const Editor: React.FC<EditorProps> = React.memo(
  ({
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
  }) => {
    const [text, setText] = useState(controlledValue || '');
    const [currentLine, setCurrentLine] = useState(1);
    const [viewportWidth, setViewportWidth] = useState(0); // 뷰포트 너비 추적
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);

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

    // 스크롤 동기화 핸들러
    const handleScroll = useCallback(
      (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (!textareaRef.current || !lineNumbersRef.current) return;

        // textarea의 스크롤을 line numbers에 동기화
        lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;

        // 부모 컴포넌트에 스크롤 이벤트 전달 (Editor ↔ Preview 동기화)
        if (onScroll) {
          onScroll(e);
        }
      },
      [onScroll]
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
      [handleTab, handleEnter, handleEquals, handleShortcut]
    );

    // 클린업: 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

    // 외부에서 value가 변경되면 내부 상태 업데이트
    useEffect(() => {
      if (controlledValue !== undefined && controlledValue !== text) {
        setText(controlledValue);
      }
    }, [controlledValue]);

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
        <div className="editor-container">
          {showLineNumbers && (
            <div ref={lineNumbersRef} className="line-numbers-wrapper">
              <LineNumbers lineWraps={lineWraps} currentLine={currentLine} />
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
    );
  }
);

Editor.displayName = 'Editor';

export default Editor;
