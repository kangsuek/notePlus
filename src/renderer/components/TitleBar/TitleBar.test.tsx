import { render, screen } from '@/__tests__/test-utils';
import TitleBar from './TitleBar';

describe('TitleBar', () => {
  it('should render without crashing', () => {
    render(<TitleBar />);
    expect(screen.getByTestId('title-bar')).toBeInTheDocument();
  });

  it('should display app title', () => {
    render(<TitleBar title="notePlus" />);
    expect(screen.getByText('notePlus')).toBeInTheDocument();
  });

  it('should display default title when not provided', () => {
    render(<TitleBar />);
    expect(screen.getByText('notePlus')).toBeInTheDocument();
  });

  it('should have proper macOS style', () => {
    const { container } = render(<TitleBar />);
    const titleBar = container.querySelector('.title-bar');
    expect(titleBar).toBeInTheDocument();
  });

  it('should be draggable', () => {
    const { container } = render(<TitleBar />);
    const titleBar = container.querySelector('.title-bar');
    expect(titleBar).toHaveClass('title-bar');
  });
});

