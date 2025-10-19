import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import LineNumbers from './LineNumbers';
import SearchBar from '../SearchBar/SearchBar';
import { EDITOR_CONFIG, MARKDOWN_SYNTAX } from '@renderer/constants';
import type { EditorProps, EditorRef } from '@renderer/types';
import { calculateLineWraps } from '@renderer/utils/lineWrapCalculator';
import { useSearch, useMarkdown, useCalculation, useIndentation } from './hooks';
import './Editor.css';

const Editor = React.memo(
  forwardRef<EditorRef, EditorProps>(
    (
      {
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
      },
      ref
    ) => {
      const [text, setText] = useState(controlledValue || '');
      const [currentLine, setCurrentLine] = useState(1);
      const [viewportWidth, setViewportWidth] = useState(0);
      const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
      const textareaRef = useRef<HTMLTextAreaElement>(null);
      const lineNumbersRef = useRef<HTMLDivElement>(null);
      const highlightContentRef = useRef<HTMLDivElement>(null);

      // Text change handler with cursor position
      const handleTextChange = useCallback(
        (newText: string, cursorPos?: number) => {
          setText(newText);

          if (onChange) {
            if (debounceMs > 0) {
              if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
              }
              debounceTimerRef.current = setTimeout(() => {
                onChange(newText);
              }, debounceMs);
            } else {
              onChange(newText);
            }
          }

          // Set cursor position if provided
          if (cursorPos !== undefined && textareaRef.current) {
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.setSelectionRange(cursorPos, cursorPos);
              }
            }, 0);
          }
        },
        [onChange, debounceMs]
      );

      // Custom hooks
      const searchHook = useSearch({
        text,
        textareaRef,
        onTextChange: handleTextChange,
      });

      const markdownHook = useMarkdown({
        text,
        textareaRef,
        onTextChange: handleTextChange,
        fileName,
      });

      const calculationHook = useCalculation({
        text,
        textareaRef,
        onTextChange: handleTextChange,
      });

      const indentationHook = useIndentation({
        text,
        textareaRef,
        onTextChange: handleTextChange,
        fileName,
      });

      // Expose methods to parent via ref
      useImperativeHandle(
        ref,
        () => ({
          openSearch: searchHook.openSearch,
          openReplace: searchHook.openReplace,
        }),
        [searchHook.openSearch, searchHook.openReplace]
      );

      // Line wraps calculation
      const lineWraps = useMemo(() => {
        if (!textareaRef.current || viewportWidth === 0) {
          const lines = text.split('\n');
          return lines.map((_, index) => ({
            logicalLineNumber: index + 1,
            isWrapped: false,
          }));
        }

        if (!text.trim()) {
          return [];
        }

        return calculateLineWraps(text, textareaRef.current);
      }, [text, viewportWidth]);

      // Update cursor position
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

      // Sync highlight layer scroll with textarea
      const syncHighlightScroll = useCallback(() => {
        if (highlightContentRef.current && textareaRef.current) {
          highlightContentRef.current.style.transform = `translate(-${textareaRef.current.scrollLeft}px, -${textareaRef.current.scrollTop}px)`;
        }
      }, []);

      // Handle scroll events
      const handleScroll = useCallback(
        (e: React.UIEvent<HTMLTextAreaElement>) => {
          if (!textareaRef.current) return;

          if (lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
          }

          syncHighlightScroll();

          if (onScroll) {
            onScroll(e);
          }
        },
        [onScroll, syncHighlightScroll]
      );

      // Handle cursor update
      const handleCursorUpdate = useCallback(() => {
        updateCursorPosition();
      }, [updateCursorPosition]);

      // Handle textarea change
      const handleTextareaChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          const newValue = e.target.value;
          setText(newValue);

          if (onChange) {
            if (debounceMs > 0) {
              if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
              }
              debounceTimerRef.current = setTimeout(() => {
                onChange(newValue);
              }, debounceMs);
            } else {
              onChange(newValue);
            }
          }
        },
        [onChange, debounceMs]
      );

      // Handle keyboard events
      const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
          // Handle Tab key
          indentationHook.handleTabKey(e);

          // Handle Enter key
          if (e.key === 'Enter') {
            indentationHook.handleEnterKey(e);
            markdownHook.handleListGeneration(e);
          }

          // Handle markdown shortcuts
          markdownHook.handleMarkdownShortcut(e);

          // Handle calculation
          calculationHook.handleCalculation(e);
        },
        [indentationHook, markdownHook, calculationHook]
      );

      // Update controlled value when prop changes
      useEffect(() => {
        if (controlledValue !== undefined && controlledValue !== text) {
          setText(controlledValue);
        }
      }, [controlledValue, text]);

      // Update viewport width on resize
      useLayoutEffect(() => {
        const updateViewportWidth = () => {
          if (textareaRef.current) {
            setViewportWidth(textareaRef.current.clientWidth);
          }
        };

        updateViewportWidth();
        window.addEventListener('resize', updateViewportWidth);
        return () => window.removeEventListener('resize', updateViewportWidth);
      }, []);

      // Sync highlight scroll on text change
      useEffect(() => {
        syncHighlightScroll();
      }, [text, syncHighlightScroll]);

      // Update search state change callback
      useEffect(() => {
        if (onSearchStateChange) {
          onSearchStateChange({
            isVisible: searchHook.isSearchVisible,
            results: searchHook.searchResults,
            currentIndex: searchHook.currentSearchIndex,
          });
        }
      }, [
        searchHook.isSearchVisible,
        searchHook.searchResults,
        searchHook.currentSearchIndex,
        onSearchStateChange,
      ]);

      // Pass textarea ref to parent
      useEffect(() => {
        if (onTextareaRef && textareaRef.current) {
          onTextareaRef(textareaRef.current);
        }
      }, [onTextareaRef]);

      // Cleanup debounce timer
      useEffect(() => {
        return () => {
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
        };
      }, []);

      return (
        <div
          className="editor-section"
          data-testid="editor-section"
          style={
            {
              '--editor-font-family': fontFamily,
              '--editor-font-size': `${fontSize}px`,
            } as React.CSSProperties
          }
        >
          <div className="editor-header">
            <h3>Editor</h3>
          </div>

          {searchHook.isSearchVisible && (
            <SearchBar
              initialQuery={searchHook.initialSearchQuery}
              onSearch={searchHook.handleSearch}
              onNextMatch={searchHook.handleNextMatch}
              onPreviousMatch={searchHook.handlePreviousMatch}
              onReplace={searchHook.handleReplace}
              onReplaceAll={searchHook.handleReplaceAll}
              onClose={searchHook.handleCloseSearch}
              results={searchHook.searchResults}
              currentIndex={searchHook.currentSearchIndex}
              query={searchHook.currentSearchQuery}
              onQueryChange={searchHook.setCurrentSearchQuery}
              options={searchHook.currentSearchOptions}
              onOptionsChange={searchHook.setCurrentSearchOptions}
            />
          )}

          <div className="editor-container">
            {showLineNumbers && (
              <div className="line-numbers-wrapper">
                <LineNumbers ref={lineNumbersRef} lineWraps={lineWraps} currentLine={currentLine} />
              </div>
            )}

            <div className="editor-textarea-wrapper">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                onClick={handleCursorUpdate}
                onKeyUp={handleCursorUpdate}
                onSelect={handleCursorUpdate}
                placeholder="마크다운으로 작성하세요..."
                className="editor-textarea monospace"
                aria-label="마크다운 편집기"
                aria-multiline="true"
                role="textbox"
                spellCheck="true"
                style={{
                  fontFamily,
                  fontSize: `${fontSize}px`,
                }}
              />

              {/* Highlight layer for search results */}
              <div
                ref={highlightContentRef}
                className="highlight-content"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: 'none',
                  overflow: 'hidden',
                  fontFamily,
                  fontSize: `${fontSize}px`,
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                }}
              >
                {searchHook.searchResults.map((result, index) => (
                  <span
                    key={`${result.start}-${result.end}`}
                    className={`search-highlight ${
                      index === searchHook.currentSearchIndex ? 'search-highlight-active' : ''
                    }`}
                    style={{
                      position: 'absolute',
                      left: `${result.start * 8.4}px`, // Approximate character width
                      top: '0px',
                      width: `${(result.end - result.start) * 8.4}px`,
                      height: '100%',
                      backgroundColor:
                        index === searchHook.currentSearchIndex ? '#ffeb3b' : '#fff59d',
                      opacity: 0.7,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }
  )
);

Editor.displayName = 'Editor';

export default Editor;
