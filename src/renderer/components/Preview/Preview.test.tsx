import { render, screen } from '@/__tests__/test-utils';
import Preview from './Preview';

describe('Preview', () => {
  it('should render without crashing', () => {
    render(<Preview />);
    expect(screen.getByTestId('preview-section')).toBeInTheDocument();
  });

  it('should render preview header', () => {
    render(<Preview />);
    expect(screen.getByRole('heading', { name: /preview/i })).toBeInTheDocument();
  });

  it('should render empty content for empty markdown', () => {
    const { container } = render(<Preview markdown="" />);
    const preview = container.querySelector('.markdown-preview');
    expect(preview).toBeInTheDocument();
    expect(preview?.textContent?.trim()).toBe('');
  });

  it('should render markdown content', () => {
    render(<Preview markdown="# Hello World" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Hello World');
  });

  it('should update when markdown prop changes', () => {
    const { rerender } = render(<Preview markdown="Initial" />);
    expect(screen.getByText('Initial')).toBeInTheDocument();

    rerender(<Preview markdown="Updated" />);
    expect(screen.getByText('Updated')).toBeInTheDocument();
    expect(screen.queryByText('Initial')).not.toBeInTheDocument();
  });
});

