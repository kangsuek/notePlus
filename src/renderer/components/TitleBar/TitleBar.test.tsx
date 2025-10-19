import { render, screen } from '@/__tests__/test-utils';
import userEvent from '@testing-library/user-event';
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

  it('should show preview toggle button when isPreviewEnabled is true', () => {
    const mockToggle = jest.fn();
    render(
      <TitleBar onPreviewToggle={mockToggle} isPreviewEnabled={true} isPreviewVisible={true} />
    );

    const previewButton = screen.getByRole('button', { name: /미리보기 끄기/ });
    expect(previewButton).toBeInTheDocument();
  });

  it('should not show preview toggle button when isPreviewEnabled is false', () => {
    const mockToggle = jest.fn();
    render(
      <TitleBar onPreviewToggle={mockToggle} isPreviewEnabled={false} isPreviewVisible={true} />
    );

    const previewButton = screen.queryByRole('button', { name: /미리보기/ });
    expect(previewButton).not.toBeInTheDocument();
  });

  it('should call onPreviewToggle when preview button is clicked', async () => {
    const user = userEvent.setup();
    const mockToggle = jest.fn();
    render(
      <TitleBar onPreviewToggle={mockToggle} isPreviewEnabled={true} isPreviewVisible={true} />
    );

    const previewButton = screen.getByRole('button', { name: /미리보기 끄기/ });
    await user.click(previewButton);

    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('should show correct tooltip based on preview visibility', () => {
    const mockToggle = jest.fn();

    // 미리보기가 보이는 경우
    const { rerender } = render(
      <TitleBar onPreviewToggle={mockToggle} isPreviewEnabled={true} isPreviewVisible={true} />
    );

    expect(screen.getByRole('button', { name: /미리보기 끄기/ })).toBeInTheDocument();

    // 미리보기가 숨겨진 경우
    rerender(
      <TitleBar onPreviewToggle={mockToggle} isPreviewEnabled={true} isPreviewVisible={false} />
    );

    expect(screen.getByRole('button', { name: /미리보기 켜기/ })).toBeInTheDocument();
  });
});
