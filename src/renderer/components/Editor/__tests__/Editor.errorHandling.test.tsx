import React from 'react';
import { render, screen, fireEvent } from '@/__tests__/test-utils';
import Editor from '../Editor';

describe('Editor - Error Handling and Edge Cases', () => {
  it('should handle invalid math expressions gracefully', () => {
    const handleChange = jest.fn();
    render(<Editor onChange={handleChange} />);

    const textarea = screen.getByPlaceholderText('마크다운으로 작성하세요...');
    fireEvent.change(textarea, { target: { value: 'invalid expression' } });

    // 커서를 줄 끝으로 이동
    (textarea as HTMLTextAreaElement).setSelectionRange(18, 18);
    fireEvent.keyDown(textarea, { key: '=', preventDefault: jest.fn() });

    // 잘못된 수식은 계산되지 않아야 함
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('should handle empty textarea gracefully', () => {
    const handleChange = jest.fn();
    render(<Editor onChange={handleChange} />);

    const textarea = screen.getByPlaceholderText('마크다운으로 작성하세요...');

    // 빈 텍스트에서 Enter 키
    fireEvent.keyDown(textarea, { key: 'Enter', preventDefault: jest.fn() });

    expect(handleChange).toHaveBeenCalledWith('\n');
  });

  it('should handle very long text without performance issues', () => {
    const handleChange = jest.fn();
    render(<Editor onChange={handleChange} />);

    const textarea = screen.getByPlaceholderText('마크다운으로 작성하세요...');

    // 매우 긴 텍스트 생성
    const longText = 'A'.repeat(10000);
    fireEvent.change(textarea, { target: { value: longText } });

    expect(handleChange).toHaveBeenCalledWith(longText);
  });

  it('should handle special characters in markdown', () => {
    const handleChange = jest.fn();
    render(<Editor onChange={handleChange} />);

    const textarea = screen.getByPlaceholderText('마크다운으로 작성하세요...');
    const specialText = 'Special chars: *bold* _italic_ `code` [link](url)';

    fireEvent.change(textarea, { target: { value: specialText } });

    expect(handleChange).toHaveBeenCalledWith(specialText);
  });
});
