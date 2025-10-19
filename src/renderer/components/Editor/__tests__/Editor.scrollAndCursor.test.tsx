import React from 'react';
import { render, screen, fireEvent } from '@/__tests__/test-utils';
import Editor from '../Editor';

describe('Editor - Scroll Synchronization and Cursor Tracking', () => {
  it('should handle scroll events', () => {
    const handleScroll = jest.fn();
    render(<Editor onScroll={handleScroll} />);

    const textarea = screen.getByPlaceholderText('마크다운으로 작성하세요...');
    fireEvent.scroll(textarea, { target: { scrollTop: 100 } });

    expect(handleScroll).toHaveBeenCalledWith(100);
  });

  it('should handle scroll with no onScroll handler', () => {
    render(<Editor />);

    const textarea = screen.getByPlaceholderText('마크다운으로 작성하세요...');

    // onScroll 핸들러가 없어도 에러가 발생하지 않아야 함
    expect(() => {
      fireEvent.scroll(textarea, { target: { scrollTop: 100 } });
    }).not.toThrow();
  });

  it('should track cursor position changes', () => {
    const handleCursorChange = jest.fn();
    render(<Editor onCursorChange={handleCursorChange} />);

    const textarea = screen.getByPlaceholderText('마크다운으로 작성하세요...');
    fireEvent.change(textarea, { target: { value: 'Hello World' } });

    // 커서 위치 변경
    (textarea as HTMLTextAreaElement).setSelectionRange(5, 5);
    fireEvent.click(textarea);

    expect(handleCursorChange).toHaveBeenCalledWith(5, 5);
  });

  it('should handle cursor position at end of text', () => {
    const handleCursorChange = jest.fn();
    render(<Editor onCursorChange={handleCursorChange} />);

    const textarea = screen.getByPlaceholderText('마크다운으로 작성하세요...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });

    // 커서를 텍스트 끝으로 이동
    (textarea as HTMLTextAreaElement).setSelectionRange(5, 5);
    fireEvent.click(textarea);

    expect(handleCursorChange).toHaveBeenCalledWith(5, 5);
  });
});
