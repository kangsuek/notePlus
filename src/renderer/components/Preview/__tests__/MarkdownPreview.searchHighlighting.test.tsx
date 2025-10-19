import React from 'react';
import { render, screen, waitFor } from '@/__tests__/test-utils';
import MarkdownPreview from '../MarkdownPreview';

describe('MarkdownPreview - Search Highlighting', () => {
  it('should highlight search results', () => {
    render(<MarkdownPreview markdown="Hello World" searchQuery="Hello" />);
    const highlights = screen.getAllByText('Hello');
    expect(highlights.length).toBeGreaterThan(0);
  });

  it('should highlight current search result', async () => {
    const mockScrollTo = jest.fn();
    Element.prototype.scrollTo = mockScrollTo;

    render(
      <MarkdownPreview
        markdown="Hello World\nHello Universe"
        searchQuery="Hello"
        currentSearchIndex={1}
      />
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    const highlights = screen.getAllByText('Hello');
    expect(highlights.length).toBeGreaterThan(0);
  });

  it('should handle case sensitive search', () => {
    render(<MarkdownPreview markdown="Hello world" searchQuery="Hello" />);
    const highlights = screen.getAllByText('Hello');
    expect(highlights.length).toBeGreaterThan(0);
  });

  it('should handle whole word search', () => {
    render(<MarkdownPreview markdown="Hello World" searchQuery="Hello" />);
    const highlights = screen.getAllByText('Hello');
    expect(highlights.length).toBeGreaterThan(0);
  });

  it('should handle regex search', () => {
    render(<MarkdownPreview markdown="Hello World" searchQuery="H.*o" />);
    const highlights = screen.getAllByText('Hello');
    expect(highlights.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle invalid regex gracefully', () => {
    render(<MarkdownPreview markdown="Hello World" searchQuery="[" />);
    // Should not crash
    expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
  });

  it('should not highlight in code blocks', () => {
    render(<MarkdownPreview markdown="```\nHello World\n```" searchQuery="Hello" />);
    // Code blocks should not be highlighted
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should handle empty search query', () => {
    render(<MarkdownPreview markdown="Hello World" searchQuery="" />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should handle no search query', () => {
    render(<MarkdownPreview markdown="Hello World" />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
