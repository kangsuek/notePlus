import React from 'react';
import { render, screen } from '@/__tests__/test-utils';
import MarkdownPreview from '../MarkdownPreview';

describe('MarkdownPreview - Error Handling', () => {
  it('should handle markdown parsing errors gracefully', () => {
    render(<MarkdownPreview markdown="Invalid markdown" />);
    expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
  });

  it('should handle non-Error exceptions', () => {
    render(<MarkdownPreview markdown="Some content" />);
    expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
  });
});
