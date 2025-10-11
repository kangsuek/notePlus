import { render, screen } from '@/__tests__/test-utils';
import StatusBar from './StatusBar';

describe('StatusBar', () => {
  it('should render without crashing', () => {
    render(<StatusBar />);
    expect(screen.getByTestId('status-bar')).toBeInTheDocument();
  });

  it('should display cursor position', () => {
    render(<StatusBar cursorPosition={{ line: 5, column: 10 }} />);
    expect(screen.getByText('줄 5, 칸 10')).toBeInTheDocument();
  });

  it('should display default cursor position when not provided', () => {
    render(<StatusBar />);
    expect(screen.getByText('줄 1, 칸 1')).toBeInTheDocument();
  });

  it('should display file encoding', () => {
    render(<StatusBar encoding="UTF-8" />);
    expect(screen.getByText('UTF-8')).toBeInTheDocument();
  });

  it('should display default encoding when not provided', () => {
    render(<StatusBar />);
    expect(screen.getByText('UTF-8')).toBeInTheDocument();
  });

  it('should not display status by default', () => {
    render(<StatusBar />);
    expect(screen.queryByText('저장됨')).not.toBeInTheDocument();
    expect(screen.queryByText('수정됨')).not.toBeInTheDocument();
  });

  it('should display save status when showStatus is true', () => {
    render(<StatusBar isDirty={false} showStatus={true} />);
    expect(screen.getByText('저장됨')).toBeInTheDocument();
  });

  it('should display modified status when showStatus is true', () => {
    render(<StatusBar isDirty={true} showStatus={true} />);
    expect(screen.getByText('수정됨')).toBeInTheDocument();
  });

  it('should have three sections', () => {
    const { container } = render(<StatusBar />);
    expect(container.querySelector('.status-left')).toBeInTheDocument();
    expect(container.querySelector('.status-center')).toBeInTheDocument();
    expect(container.querySelector('.status-right')).toBeInTheDocument();
  });
});

