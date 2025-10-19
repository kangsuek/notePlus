import { useState, useCallback } from 'react';
import {
  searchText,
  replaceAtIndex,
  replaceAll,
  getNextResultIndex,
  getPreviousResultIndex,
  type SearchResult,
  type SearchOptions,
} from '@renderer/utils/searchUtils';

export interface UseSearchProps {
  text: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onTextChange: (newText: string) => void;
}

export function useSearch({ text, textareaRef, onTextChange }: UseSearchProps) {
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
  }, [text, textareaRef]);

  // Search functionality
  const handleSearch = useCallback(
    (query: string, options: SearchOptions) => {
      if (!query.trim()) {
        setSearchResults([]);
        setCurrentSearchIndex(-1);
        return;
      }

      const results = searchText(text, query, options);
      setSearchResults(results);
      setCurrentSearchIndex(results.length > 0 ? 0 : -1);
      setCurrentSearchQuery(query);
      setCurrentSearchOptions(options);
    },
    [text]
  );

  const handleNextMatch = useCallback(() => {
    if (searchResults.length === 0) return;
    const nextIndex = getNextResultIndex(currentSearchIndex, searchResults.length);
    setCurrentSearchIndex(nextIndex);
  }, [currentSearchIndex, searchResults.length]);

  const handlePreviousMatch = useCallback(() => {
    if (searchResults.length === 0) return;
    const prevIndex = getPreviousResultIndex(currentSearchIndex, searchResults.length);
    setCurrentSearchIndex(prevIndex);
  }, [currentSearchIndex, searchResults.length]);

  const handleReplace = useCallback(
    (replaceText: string) => {
      if (currentSearchIndex === -1 || searchResults.length === 0) return;

      const result = searchResults[currentSearchIndex];
      const newText = replaceAtIndex(text, result.index, result.index + result.length, replaceText);
      onTextChange(newText);

      // Update search results after replacement
      const newResults = searchText(newText, currentSearchQuery, currentSearchOptions);
      setSearchResults(newResults);

      // Adjust current index
      if (newResults.length === 0) {
        setCurrentSearchIndex(-1);
      } else if (currentSearchIndex >= newResults.length) {
        setCurrentSearchIndex(newResults.length - 1);
      }
    },
    [
      currentSearchIndex,
      searchResults,
      text,
      currentSearchQuery,
      currentSearchOptions,
      onTextChange,
    ]
  );

  const handleReplaceAll = useCallback(
    (replaceText: string) => {
      if (searchResults.length === 0) return;

      const result = replaceAll(text, currentSearchQuery, replaceText, currentSearchOptions);
      onTextChange(result.newText);
      setSearchResults([]);
      setCurrentSearchIndex(-1);
    },
    [text, currentSearchQuery, currentSearchOptions, onTextChange]
  );

  const handleCloseSearch = useCallback(() => {
    setIsSearchVisible(false);
    setSearchResults([]);
    setCurrentSearchIndex(-1);
    setCurrentSearchQuery('');
    setInitialSearchQuery('');
  }, []);

  const openSearch = useCallback(() => {
    const selectedText = getSelectedText();
    if (selectedText) {
      setInitialSearchQuery(selectedText);
    } else {
      setInitialSearchQuery('');
    }
    setIsSearchVisible(true);
  }, [getSelectedText]);

  const openReplace = useCallback(() => {
    const selectedText = getSelectedText();
    if (selectedText) {
      setInitialSearchQuery(selectedText);
    } else {
      setInitialSearchQuery('');
    }
    setIsSearchVisible(true);
  }, [getSelectedText]);

  return {
    // State
    isSearchVisible,
    searchResults,
    currentSearchIndex,
    currentSearchQuery,
    currentSearchOptions,
    initialSearchQuery,

    // Actions
    handleSearch,
    handleNextMatch,
    handlePreviousMatch,
    handleReplace,
    handleReplaceAll,
    handleCloseSearch,
    openSearch,
    openReplace,

    // Setters
    setIsSearchVisible,
    setCurrentSearchQuery,
    setCurrentSearchOptions,
  };
}
