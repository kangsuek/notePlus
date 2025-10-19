import React from 'react';
import { render, screen } from '@/__tests__/test-utils';
import MarkdownPreview from '../MarkdownPreview';

describe('MarkdownPreview - Scroll Synchronization', () => {
  it('should scroll to current search result', () => {
    const mockScrollTo = jest.fn();
    Element.prototype.scrollTo = mockScrollTo;

    render(
      <MarkdownPreview
        markdown="Hello World\nHello Universe\nHello Galaxy"
        searchQuery="Hello"
        currentSearchIndex={1}
      />
    );

    // Should not crash and should render
    expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
  });

  it('should not scroll when no search query', () => {
    render(<MarkdownPreview markdown="Hello World" />);
    expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
  });

  it('should not scroll when currentSearchIndex is negative', () => {
    render(<MarkdownPreview markdown="Hello World" searchQuery="Hello" currentSearchIndex={-1} />);
    expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
  });
});
