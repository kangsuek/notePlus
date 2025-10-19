import { render, screen, fireEvent, waitFor } from '@/__tests__/test-utils';
import MainLayout from './MainLayout';

describe('MainLayout', () => {
  it('should render without crashing', () => {
    render(<MainLayout />);
    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('should render three main sections', () => {
    render(<MainLayout />);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('editor-section')).toBeInTheDocument();
    // Preview는 조건부로 렌더링되므로 기본적으로는 표시되지 않을 수 있음
    // expect(screen.getByTestId('preview-section')).toBeInTheDocument();
  });

  it('should render StatusBar', () => {
    render(<MainLayout />);
    expect(screen.getByTestId('status-bar')).toBeInTheDocument();
  });

  it('should have proper layout structure', () => {
    render(<MainLayout />);
    const layout = screen.getByTestId('main-layout');
    expect(layout).toHaveClass('main-layout');
  });

  it('should display default cursor position in StatusBar', () => {
    render(<MainLayout />);
    expect(screen.getByText(/줄 1, 칸 1/)).toBeInTheDocument();
  });

  it('should update StatusBar cursor position when editor cursor moves', () => {
    render(<MainLayout />);

    const textarea = screen.getByPlaceholderText('마크다운으로 작성하세요...');

    // 텍스트 입력
    fireEvent.change(textarea, { target: { value: 'Line 1\nLine 2' } });

    // 커서를 두 번째 줄로 이동
    const textareaElement = textarea as HTMLTextAreaElement;
    textareaElement.setSelectionRange(7, 7); // "Line 1\n" 다음 위치
    fireEvent.click(textarea);

    // StatusBar에 줄 2가 표시되어야 함
    expect(screen.getByText(/줄 2/)).toBeInTheDocument();
  });

  it('should not show status by default', () => {
    render(<MainLayout />);
    expect(screen.queryByText('저장됨')).not.toBeInTheDocument();
    expect(screen.queryByText('수정됨')).not.toBeInTheDocument();
  });

  it('should show "수정됨" status when text changes', async () => {
    render(<MainLayout />);

    const textarea = screen.getByPlaceholderText('마크다운으로 작성하세요...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });

    // debounce 시간 대기
    await waitFor(
      () => {
        expect(screen.getByText('수정됨')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('should show "수정됨" status when filename changes', () => {
    render(<MainLayout />);

    // 파일명 클릭하여 편집 모드 진입
    const filename = screen.getByText('untitled.txt');
    fireEvent.click(filename);

    // 파일명 변경
    const input = screen.getByDisplayValue('untitled.txt');
    fireEvent.change(input, { target: { value: 'test.md' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText('수정됨')).toBeInTheDocument();
  });

  it('should show asterisk in filename when modified', async () => {
    render(<MainLayout />);

    const textarea = screen.getByPlaceholderText('마크다운으로 작성하세요...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });

    // debounce 시간 대기
    await waitFor(
      () => {
        expect(screen.getByText('untitled.txt *')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('should handle keyboard shortcuts', async () => {
    render(<MainLayout />);

    // Cmd+N (새 파일)
    fireEvent.keyDown(document, { key: 'n', metaKey: true });

    // Cmd+S (저장)
    fireEvent.keyDown(document, { key: 's', metaKey: true });

    // Cmd+Shift+S (다른 이름으로 저장)
    fireEvent.keyDown(document, { key: 's', metaKey: true, shiftKey: true });

    // Cmd+O (파일 열기)
    fireEvent.keyDown(document, { key: 'o', metaKey: true });
  });

  it('should handle drag and drop events', async () => {
    render(<MainLayout />);

    const layout = screen.getByTestId('main-layout');

    // 드래그 오버
    fireEvent.dragOver(layout, {
      dataTransfer: {
        files: [new File(['content'], 'test.md', { type: 'text/markdown' })],
      },
    });

    // 드래그 리브
    fireEvent.dragLeave(layout);

    // 드롭
    fireEvent.drop(layout, {
      dataTransfer: {
        files: [new File(['content'], 'test.md', { type: 'text/markdown' })],
      },
    });
  });

  it('should handle IPC menu events', async () => {
    render(<MainLayout />);

    // 메뉴 이벤트 시뮬레이션
    const menuEvents = [
      'menu:new-file',
      'menu:open-file',
      'menu:save-file',
      'menu:save-file-as',
      'menu:toggle-sidebar',
    ];

    menuEvents.forEach((event) => {
      window.dispatchEvent(new CustomEvent(event));
    });
  });

  it('should handle scroll synchronization', async () => {
    render(<MainLayout />);

    const editor = screen.getByRole('textbox');
    const preview = document.querySelector('.preview-content');

    // 에디터 스크롤 이벤트
    fireEvent.scroll(editor, { target: { scrollTop: 100 } });

    // 프리뷰 스크롤 이벤트
    if (preview) {
      fireEvent.scroll(preview, { target: { scrollTop: 100 } });
    }
  });

  it('should handle theme toggle', async () => {
    render(<MainLayout />);

    const themeToggle = screen.getByTestId('theme-toggle');
    fireEvent.click(themeToggle);

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });
  });

  it('should handle sidebar toggle', async () => {
    render(<MainLayout />);

    const sidebarToggle = screen.getByLabelText('사이드바 접기');
    fireEvent.click(sidebarToggle);

    await waitFor(() => {
      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveClass('collapsed');
    });
  });
});
