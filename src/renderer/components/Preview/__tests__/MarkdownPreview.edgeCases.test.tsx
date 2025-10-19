import React from 'react';
import { render, screen } from '@/__tests__/test-utils';
import MarkdownPreview from '../MarkdownPreview';

describe('MarkdownPreview - Edge Cases and Performance', () => {
  it('should handle very long markdown content', () => {
    const longContent = '# Heading\n' + 'This is a very long line. '.repeat(1000);
    render(<MarkdownPreview markdown={longContent} />);
    expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
  });

  it('should handle markdown with special characters', () => {
    const specialChars = 'Special chars: !@#$%^&*()_+-=[]{}|;\':",./<>?';
    render(<MarkdownPreview markdown={specialChars} />);
    expect(screen.getByText(/Special chars:/)).toBeInTheDocument();
  });

  it('should handle markdown with HTML entities', () => {
    render(<MarkdownPreview markdown='&lt;div&gt; &amp; "quoted"' />);
    expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
  });

  it('should handle markdown with mixed line endings', () => {
    const mixedEndings = 'Line 1\r\nLine 2\nLine 3\rLine 4';
    render(<MarkdownPreview markdown={mixedEndings} />);
    expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
  });

  it('should handle search with complex regex patterns', () => {
    render(
      <MarkdownPreview
        markdown="Email: test@example.com Phone: 123-456-7890"
        searchQuery="\\b\\w+@\\w+\\.\\w+\\b"
      />
    );
    expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
  });
});
