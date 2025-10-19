import React, { useState, useCallback, useEffect, useRef } from 'react';
import './SearchBar.css';

export interface SearchBarProps {
  onSearch: (query: string, options: SearchOptions) => void;
  onReplace: (replacement: string) => void;
  onReplaceAll: (replacement: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  currentIndex: number;
  totalResults: number;
  isVisible: boolean;
  initialQuery?: string; // 초기 검색어
}

export interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onReplace,
  onReplaceAll,
  onNext,
  onPrevious,
  onClose,
  currentIndex,
  totalResults,
  isVisible,
  initialQuery = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
  });
  const [regexError, setRegexError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Set initial query when provided
  useEffect(() => {
    if (initialQuery && isVisible) {
      setSearchQuery(initialQuery);
      // Automatically trigger search with initial query
      if (initialQuery.trim()) {
        onSearch(initialQuery, options);
      }
    }
  }, [initialQuery, isVisible]); // Don't include onSearch and options to avoid infinite loop

  // Focus search input when search bar becomes visible
  useEffect(() => {
    if (isVisible && searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select();
    }
  }, [isVisible]);

  // Validate regex when query or options change (but don't trigger search)
  useEffect(() => {
    if (searchQuery && options.useRegex) {
      try {
        new RegExp(searchQuery);
        setRegexError(null);
      } catch (error) {
        setRegexError((error as Error).message);
      }
    } else {
      setRegexError(null);
    }
  }, [searchQuery, options.useRegex]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleReplaceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setReplaceText(e.target.value);
  }, []);

  const handleToggleOption = useCallback(
    (option: keyof SearchOptions) => {
      const newOptions = {
        ...options,
        [option]: !options[option],
      };
      setOptions(newOptions);

      // Re-trigger search with new options if there's a query
      if (searchQuery) {
        onSearch(searchQuery, newOptions);
      }
    },
    [options, searchQuery, onSearch]
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();

        // Validate regex before searching
        if (searchQuery && options.useRegex) {
          try {
            new RegExp(searchQuery);
          } catch (error) {
            return; // Don't search if regex is invalid
          }
        }

        // If there are no results yet, trigger initial search
        if (searchQuery && totalResults === 0) {
          onSearch(searchQuery, options);
        } else if (searchQuery && totalResults > 0) {
          // If there are results, just navigate without re-searching
          // This allows navigation through existing results
        }

        // Navigate to next/previous result
        if (e.shiftKey) {
          onPrevious();
        } else {
          onNext();
        }

        // Focus stays on search input (no focus manipulation needed)
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation(); // 이벤트 전파 방지
        onClose();
      }
    },
    [searchQuery, options, totalResults, onSearch, onNext, onPrevious, onClose]
  );

  const handleReplaceKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (replaceText !== undefined) {
          onReplace(replaceText);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation(); // 이벤트 전파 방지
        onClose();
      }
    },
    [replaceText, onReplace, onClose]
  );

  const handleReplace = useCallback(() => {
    if (replaceText !== undefined) {
      onReplace(replaceText);
    }
  }, [replaceText, onReplace]);

  const handleReplaceAll = useCallback(() => {
    if (replaceText !== undefined) {
      onReplaceAll(replaceText);
    }
  }, [replaceText, onReplaceAll]);

  const handleToggleReplace = useCallback(() => {
    setShowReplace((prev) => !prev);
  }, []);

  if (!isVisible) {
    return null;
  }

  const displayText =
    totalResults > 0 ? `${currentIndex + 1} / ${totalResults}` : searchQuery ? '결과 없음' : '';

  return (
    <div className="search-bar" data-testid="search-bar">
      <div className="search-bar-row">
        <div className="search-input-container">
          <input
            ref={searchInputRef}
            type="text"
            className={`search-input ${regexError ? 'error' : ''}`}
            placeholder="찾기 (Enter로 검색)"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            aria-label="검색어"
          />
          {regexError && (
            <div className="regex-error" title={regexError}>
              잘못된 정규식
            </div>
          )}
        </div>

        <span className="search-results" data-testid="search-results">
          {displayText}
        </span>

        <div className="search-navigation">
          <button
            className="search-button"
            onClick={onPrevious}
            disabled={totalResults === 0}
            aria-label="이전 결과"
            title="이전 (Shift+Enter)"
          >
            ↑
          </button>
          <button
            className="search-button"
            onClick={onNext}
            disabled={totalResults === 0}
            aria-label="다음 결과"
            title="다음 (Enter)"
          >
            ↓
          </button>
        </div>

        <div className="search-options">
          <button
            className={`option-button ${options.caseSensitive ? 'active' : ''}`}
            onClick={() => handleToggleOption('caseSensitive')}
            title="대소문자 구분"
            aria-label="대소문자 구분"
            aria-pressed={options.caseSensitive}
          >
            Aa
          </button>
          <button
            className={`option-button ${options.wholeWord ? 'active' : ''}`}
            onClick={() => handleToggleOption('wholeWord')}
            title="단어 단위로 찾기"
            aria-label="단어 단위로 찾기"
            aria-pressed={options.wholeWord}
          >
            |W|
          </button>
          <button
            className={`option-button ${options.useRegex ? 'active' : ''}`}
            onClick={() => handleToggleOption('useRegex')}
            title="정규식 사용"
            aria-label="정규식 사용"
            aria-pressed={options.useRegex}
          >
            .*
          </button>
        </div>

        <button
          className={`toggle-replace-button ${showReplace ? 'active' : ''}`}
          onClick={handleToggleReplace}
          title="바꾸기 토글"
          aria-label="바꾸기 토글"
          aria-expanded={showReplace}
        >
          ⇅
        </button>

        <button
          className="close-button"
          onClick={onClose}
          aria-label="검색 닫기"
          title="닫기 (Esc)"
        >
          ✕
        </button>
      </div>

      {showReplace && (
        <div className="search-bar-row replace-row">
          <div className="replace-input-container">
            <input
              type="text"
              className="replace-input"
              placeholder="바꾸기 (Enter로 바꾸기)"
              value={replaceText}
              onChange={handleReplaceChange}
              onKeyDown={handleReplaceKeyDown}
              aria-label="바꿀 텍스트"
            />
          </div>

          <div className="replace-actions">
            <button
              className="replace-button"
              onClick={handleReplace}
              disabled={totalResults === 0 || !searchQuery}
              aria-label="바꾸기"
            >
              바꾸기
            </button>
            <button
              className="replace-button"
              onClick={handleReplaceAll}
              disabled={totalResults === 0 || !searchQuery}
              aria-label="모두 바꾸기"
            >
              모두 바꾸기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

SearchBar.displayName = 'SearchBar';

export default SearchBar;
