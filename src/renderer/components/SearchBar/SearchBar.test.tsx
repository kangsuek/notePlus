import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchBar, { SearchBarProps } from './SearchBar';

describe('SearchBar', () => {
  const defaultProps: SearchBarProps = {
    onSearch: jest.fn(),
    onReplace: jest.fn(),
    onReplaceAll: jest.fn(),
    onNext: jest.fn(),
    onPrevious: jest.fn(),
    onClose: jest.fn(),
    currentIndex: 0,
    totalResults: 5,
    isVisible: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Visibility', () => {
    it('should render when isVisible is true', () => {
      render(<SearchBar {...defaultProps} />);
      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    });

    it('should not render when isVisible is false', () => {
      render(<SearchBar {...defaultProps} isVisible={false} />);
      expect(screen.queryByTestId('search-bar')).not.toBeInTheDocument();
    });
  });

  describe('Search Input', () => {
    it('should render search input', () => {
      render(<SearchBar {...defaultProps} />);
      expect(screen.getByPlaceholderText(/찾기/)).toBeInTheDocument();
    });

    it('should update search query on input change', async () => {
      render(<SearchBar {...defaultProps} />);
      const input = screen.getByPlaceholderText(/찾기/);

      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        expect(input).toHaveValue('test');
      });
    });

    it('should call onSearch when Enter is pressed', async () => {
      const onSearch = jest.fn();
      render(<SearchBar {...defaultProps} onSearch={onSearch} />);
      const input = screen.getByPlaceholderText(/찾기/);

      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('test', {
          caseSensitive: false,
          wholeWord: false,
          useRegex: false,
        });
      });
    });

    it('should not call onSearch when typing without Enter', async () => {
      const onSearch = jest.fn();
      render(<SearchBar {...defaultProps} onSearch={onSearch} />);
      const input = screen.getByPlaceholderText(/찾기/);

      fireEvent.change(input, { target: { value: 'test' } });

      // Wait a bit to ensure onSearch is not called
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onSearch).not.toHaveBeenCalled();
    });

    it('should focus search input when visible', () => {
      const { rerender } = render(<SearchBar {...defaultProps} isVisible={false} />);

      rerender(<SearchBar {...defaultProps} isVisible={true} />);

      const input = screen.getByPlaceholderText(/찾기/);
      expect(input).toHaveFocus();
    });
  });

  describe('Navigation', () => {
    it('should display current index and total results', () => {
      render(<SearchBar {...defaultProps} currentIndex={2} totalResults={10} />);
      expect(screen.getByText('3 / 10')).toBeInTheDocument();
    });

    it('should display "No results" when search has no matches', () => {
      const { rerender } = render(<SearchBar {...defaultProps} totalResults={0} />);
      const input = screen.getByPlaceholderText(/찾기/);
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      rerender(<SearchBar {...defaultProps} totalResults={0} />);
      expect(screen.getByText('결과 없음')).toBeInTheDocument();
    });

    it('should call onNext when next button is clicked', () => {
      const onNext = jest.fn();
      render(<SearchBar {...defaultProps} onNext={onNext} />);

      const nextButton = screen.getByLabelText('다음 결과');
      fireEvent.click(nextButton);

      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('should call onPrevious when previous button is clicked', () => {
      const onPrevious = jest.fn();
      render(<SearchBar {...defaultProps} onPrevious={onPrevious} />);

      const prevButton = screen.getByLabelText('이전 결과');
      fireEvent.click(prevButton);

      expect(onPrevious).toHaveBeenCalledTimes(1);
    });

    it('should disable navigation buttons when no results', () => {
      render(<SearchBar {...defaultProps} totalResults={0} />);

      const nextButton = screen.getByLabelText('다음 결과');
      const prevButton = screen.getByLabelText('이전 결과');

      expect(nextButton).toBeDisabled();
      expect(prevButton).toBeDisabled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should call onSearch and onNext on Enter key', () => {
      const onSearch = jest.fn();
      const onNext = jest.fn();
      render(<SearchBar {...defaultProps} onSearch={onSearch} onNext={onNext} />);

      const input = screen.getByPlaceholderText(/찾기/);
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onSearch).toHaveBeenCalledWith('test', {
        caseSensitive: false,
        wholeWord: false,
        useRegex: false,
      });
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('should call onSearch and onPrevious on Shift+Enter', () => {
      const onSearch = jest.fn();
      const onPrevious = jest.fn();
      render(<SearchBar {...defaultProps} onSearch={onSearch} onPrevious={onPrevious} />);

      const input = screen.getByPlaceholderText(/찾기/);
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

      expect(onSearch).toHaveBeenCalledWith('test', {
        caseSensitive: false,
        wholeWord: false,
        useRegex: false,
      });
      expect(onPrevious).toHaveBeenCalledTimes(1);
    });

    it('should call onClose on Escape key', () => {
      const onClose = jest.fn();
      render(<SearchBar {...defaultProps} onClose={onClose} />);

      const input = screen.getByPlaceholderText(/찾기/);
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Search Options', () => {
    it('should toggle case sensitive option and trigger search', async () => {
      const onSearch = jest.fn();
      render(<SearchBar {...defaultProps} onSearch={onSearch} />);

      const input = screen.getByPlaceholderText(/찾기/);
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      const caseButton = screen.getByLabelText('대소문자 구분');
      fireEvent.click(caseButton);

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('test', {
          caseSensitive: true,
          wholeWord: false,
          useRegex: false,
        });
      });
    });

    it('should toggle whole word option and trigger search', async () => {
      const onSearch = jest.fn();
      render(<SearchBar {...defaultProps} onSearch={onSearch} />);

      const input = screen.getByPlaceholderText(/찾기/);
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      const wholeWordButton = screen.getByLabelText('단어 단위로 찾기');
      fireEvent.click(wholeWordButton);

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('test', {
          caseSensitive: false,
          wholeWord: true,
          useRegex: false,
        });
      });
    });

    it('should toggle regex option and trigger search', async () => {
      const onSearch = jest.fn();
      render(<SearchBar {...defaultProps} onSearch={onSearch} />);

      const input = screen.getByPlaceholderText(/찾기/);
      fireEvent.change(input, { target: { value: '\\d+' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      const regexButton = screen.getByLabelText('정규식 사용');
      fireEvent.click(regexButton);

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('\\d+', {
          caseSensitive: false,
          wholeWord: false,
          useRegex: true,
        });
      });
    });

    it('should show regex error for invalid regex', async () => {
      render(<SearchBar {...defaultProps} />);

      const input = screen.getByPlaceholderText(/찾기/);
      const regexButton = screen.getByLabelText('정규식 사용');

      fireEvent.click(regexButton);
      fireEvent.change(input, { target: { value: '[invalid' } });

      await waitFor(() => {
        expect(screen.getByText('잘못된 정규식')).toBeInTheDocument();
      });
    });
  });

  describe('Replace Functionality', () => {
    it('should toggle replace UI', () => {
      render(<SearchBar {...defaultProps} />);

      const toggleButton = screen.getByLabelText('바꾸기 토글');
      fireEvent.click(toggleButton);

      expect(screen.getByPlaceholderText(/바꾸기/)).toBeInTheDocument();
    });

    it('should hide replace UI when toggled off', () => {
      render(<SearchBar {...defaultProps} />);

      const toggleButton = screen.getByLabelText('바꾸기 토글');
      fireEvent.click(toggleButton);
      expect(screen.getByPlaceholderText(/바꾸기/)).toBeInTheDocument();

      fireEvent.click(toggleButton);
      expect(screen.queryByPlaceholderText(/바꾸기/)).not.toBeInTheDocument();
    });

    it('should call onReplace when replace button is clicked', async () => {
      const onReplace = jest.fn();
      render(<SearchBar {...defaultProps} onReplace={onReplace} totalResults={5} />);

      // First enter a search query
      const searchInput = screen.getByPlaceholderText(/찾기/);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      const toggleButton = screen.getByLabelText('바꾸기 토글');
      fireEvent.click(toggleButton);

      const replaceInput = screen.getByPlaceholderText(/바꾸기/);
      fireEvent.change(replaceInput, { target: { value: 'replacement' } });

      const replaceButton = screen.getByLabelText('바꾸기');
      fireEvent.click(replaceButton);

      await waitFor(() => {
        expect(onReplace).toHaveBeenCalledWith('replacement');
      });
    });

    it('should call onReplaceAll when replace all button is clicked', async () => {
      const onReplaceAll = jest.fn();
      render(<SearchBar {...defaultProps} onReplaceAll={onReplaceAll} totalResults={5} />);

      // First enter a search query
      const searchInput = screen.getByPlaceholderText(/찾기/);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      const toggleButton = screen.getByLabelText('바꾸기 토글');
      fireEvent.click(toggleButton);

      const replaceInput = screen.getByPlaceholderText(/바꾸기/);
      fireEvent.change(replaceInput, { target: { value: 'replacement' } });

      const replaceAllButton = screen.getByLabelText('모두 바꾸기');
      fireEvent.click(replaceAllButton);

      await waitFor(() => {
        expect(onReplaceAll).toHaveBeenCalledWith('replacement');
      });
    });

    it('should call onReplace when Enter is pressed in replace input', async () => {
      const onReplace = jest.fn();
      render(<SearchBar {...defaultProps} onReplace={onReplace} totalResults={5} />);

      const searchInput = screen.getByPlaceholderText(/찾기/);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      const toggleButton = screen.getByLabelText('바꾸기 토글');
      fireEvent.click(toggleButton);

      const replaceInput = screen.getByPlaceholderText(/바꾸기/);
      fireEvent.change(replaceInput, { target: { value: 'replacement' } });
      fireEvent.keyDown(replaceInput, { key: 'Enter' });

      await waitFor(() => {
        expect(onReplace).toHaveBeenCalledWith('replacement');
      });
    });

    it('should disable replace buttons when no results', () => {
      render(<SearchBar {...defaultProps} totalResults={0} />);

      const toggleButton = screen.getByLabelText('바꾸기 토글');
      fireEvent.click(toggleButton);

      const replaceButton = screen.getByLabelText('바꾸기');
      const replaceAllButton = screen.getByLabelText('모두 바꾸기');

      expect(replaceButton).toBeDisabled();
      expect(replaceAllButton).toBeDisabled();
    });
  });

  describe('Close Button', () => {
    it('should call onClose when close button is clicked', () => {
      const onClose = jest.fn();
      render(<SearchBar {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByLabelText('검색 닫기');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<SearchBar {...defaultProps} />);

      expect(screen.getByLabelText('검색어')).toBeInTheDocument();
      expect(screen.getByLabelText('다음 결과')).toBeInTheDocument();
      expect(screen.getByLabelText('이전 결과')).toBeInTheDocument();
      expect(screen.getByLabelText('대소문자 구분')).toBeInTheDocument();
      expect(screen.getByLabelText('단어 단위로 찾기')).toBeInTheDocument();
      expect(screen.getByLabelText('정규식 사용')).toBeInTheDocument();
      expect(screen.getByLabelText('검색 닫기')).toBeInTheDocument();
    });

    it('should have proper ARIA pressed state for option buttons', () => {
      render(<SearchBar {...defaultProps} />);

      const caseButton = screen.getByLabelText('대소문자 구분');
      expect(caseButton).toHaveAttribute('aria-pressed', 'false');

      fireEvent.click(caseButton);
      expect(caseButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should have proper ARIA expanded state for replace toggle', () => {
      render(<SearchBar {...defaultProps} />);

      const toggleButton = screen.getByLabelText('바꾸기 토글');
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
