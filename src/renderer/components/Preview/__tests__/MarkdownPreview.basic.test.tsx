import React from 'react';
import { render, screen } from '@/__tests__/test-utils';
import MarkdownPreview from '../MarkdownPreview';

describe('MarkdownPreview - Basic Rendering', () => {
  it('should render without crashing', () => {
    render(<MarkdownPreview markdown="# Hello" />);
    expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
  });

  it('should render empty content for empty markdown', () => {
    render(<MarkdownPreview markdown="" />);
    expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
  });

  it('should render plain text', () => {
    render(<MarkdownPreview markdown="Hello World" />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should render heading H1', () => {
    render(<MarkdownPreview markdown="# Heading 1" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Heading 1');
  });

  it('should render heading H2', () => {
    render(<MarkdownPreview markdown="## Heading 2" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Heading 2');
  });

  it('should render paragraph', () => {
    render(<MarkdownPreview markdown="This is a paragraph." />);
    expect(screen.getByText('This is a paragraph.')).toBeInTheDocument();
  });

  it('should render bold text', () => {
    render(<MarkdownPreview markdown="**Bold text**" />);
    const boldElement = screen.getByText('Bold text');
    expect(boldElement.tagName).toBe('STRONG');
  });

  it('should render italic text', () => {
    render(<MarkdownPreview markdown="*Italic text*" />);
    const italicElement = screen.getByText('Italic text');
    expect(italicElement.tagName).toBe('EM');
  });

  it('should render unordered list', () => {
    render(<MarkdownPreview markdown="- Item 1\n- Item 2" />);
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    expect(screen.getByText(/Item 1/)).toBeInTheDocument();
    expect(screen.getByText(/Item 2/)).toBeInTheDocument();
  });

  it('should render ordered list', () => {
    render(<MarkdownPreview markdown="1. First\n2. Second" />);
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    expect(screen.getByText(/First/)).toBeInTheDocument();
    expect(screen.getByText(/Second/)).toBeInTheDocument();
  });

  it('should render link', () => {
    render(<MarkdownPreview markdown="[Link](https://example.com)" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveTextContent('Link');
  });

  it('should render inline code', () => {
    render(<MarkdownPreview markdown="`inline code`" />);
    const codeElement = screen.getByText('inline code');
    expect(codeElement.tagName).toBe('CODE');
  });

  it('should render code block', () => {
    render(<MarkdownPreview markdown="```\ncode block\n```" />);
    const codeBlock = screen.getByText(/code block/);
    expect(codeBlock.tagName).toBe('CODE');
  });

  it('should render blockquote', () => {
    render(<MarkdownPreview markdown="> This is a quote" />);
    const blockquote = screen.getByText('This is a quote');
    expect(blockquote.closest('blockquote')).toBeInTheDocument();
  });

  it('should sanitize dangerous HTML', () => {
    render(<MarkdownPreview markdown="<script>alert('xss')</script>" />);
    expect(screen.queryByText("alert('xss')")).not.toBeInTheDocument();
  });

  it('should update when markdown prop changes', () => {
    const { rerender } = render(<MarkdownPreview markdown="# First" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('First');

    rerender(<MarkdownPreview markdown="# Second" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Second');
  });
});
