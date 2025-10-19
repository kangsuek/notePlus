import React from 'react';
import { render, screen } from '@/__tests__/test-utils';
import MarkdownPreview from '../MarkdownPreview';

describe('MarkdownPreview - Advanced Features', () => {
  it('should render heading H3', () => {
    render(<MarkdownPreview markdown="### Heading 3" />);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Heading 3');
  });

  it('should render heading H4', () => {
    render(<MarkdownPreview markdown="#### Heading 4" />);
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Heading 4');
  });

  it('should render heading H5', () => {
    render(<MarkdownPreview markdown="##### Heading 5" />);
    expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent('Heading 5');
  });

  it('should render heading H6', () => {
    render(<MarkdownPreview markdown="###### Heading 6" />);
    expect(screen.getByRole('heading', { level: 6 })).toHaveTextContent('Heading 6');
  });

  it('should render image', () => {
    render(<MarkdownPreview markdown="![Alt text](https://example.com/image.jpg)" />);
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(image).toHaveAttribute('alt', 'Alt text');
  });

  it('should render image with title', () => {
    render(<MarkdownPreview markdown='![Alt text](https://example.com/image.jpg "Image title")' />);
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(image).toHaveAttribute('alt', 'Alt text');
    expect(image).toHaveAttribute('title', 'Image title');
  });

  it('should render table', () => {
    render(
      <MarkdownPreview
        markdown={`
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`}
      />
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Header 1')).toBeInTheDocument();
    expect(screen.getByText('Header 2')).toBeInTheDocument();
    expect(screen.getByText('Cell 1')).toBeInTheDocument();
    expect(screen.getByText('Cell 2')).toBeInTheDocument();
  });

  it('should render horizontal rule', () => {
    render(<MarkdownPreview markdown="---" />);
    const hr = screen.getByRole('separator');
    expect(hr).toBeInTheDocument();
  });

  it('should render horizontal rule with asterisks', () => {
    render(<MarkdownPreview markdown="***" />);
    const hr = screen.getByRole('separator');
    expect(hr).toBeInTheDocument();
  });

  it('should render strikethrough text', () => {
    render(<MarkdownPreview markdown="~~Strikethrough~~" />);
    const strikethroughElement = screen.getByText('Strikethrough');
    expect(strikethroughElement.tagName).toBe('DEL');
  });

  it('should render task list', () => {
    render(
      <MarkdownPreview
        markdown={`
- [x] Completed task
- [ ] Incomplete task
`}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it('should render nested list', () => {
    render(
      <MarkdownPreview
        markdown={`
- Level 1
  - Level 2
    - Level 3
`}
      />
    );
    expect(screen.getByText('Level 1')).toBeInTheDocument();
    expect(screen.getByText('Level 2')).toBeInTheDocument();
    expect(screen.getByText('Level 3')).toBeInTheDocument();
  });

  it('should render mixed formatting', () => {
    render(
      <MarkdownPreview markdown="**Bold** and *italic* with `code` and [link](https://example.com)" />
    );
    expect(screen.getByText('Bold')).toBeInTheDocument();
    expect(screen.getByText('italic')).toBeInTheDocument();
    expect(screen.getByText('code')).toBeInTheDocument();
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('should render links in headings', () => {
    render(<MarkdownPreview markdown="# [Heading with Link](https://example.com)" />);
    const heading = screen.getByRole('heading', { level: 1 });
    const link = screen.getByRole('link');
    expect(heading).toContainElement(link);
    expect(link).toHaveAttribute('href', 'https://example.com');
  });
});
