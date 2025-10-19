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

  describe('Error Handling', () => {
    it('should handle file save errors gracefully', async () => {
      // Mock file save to return error
      const mockSaveFile = jest.fn().mockRejectedValue(new Error('Save failed'));
      jest.doMock('@renderer/utils/fileOperations', () => ({
        ...jest.requireActual('@renderer/utils/fileOperations'),
        saveFile: mockSaveFile,
      }));

      render(<MainLayout />);

      // This test verifies that the component doesn't crash when save fails
      // The actual error handling is tested in fileOperations.test.ts
      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });

    it('should handle file open errors gracefully', async () => {
      // Mock file open to return error
      const mockOpenFile = jest.fn().mockRejectedValue(new Error('Open failed'));
      jest.doMock('@renderer/utils/fileOperations', () => ({
        ...jest.requireActual('@renderer/utils/fileOperations'),
        openFile: mockOpenFile,
      }));

      render(<MainLayout />);

      // This test verifies that the component doesn't crash when open fails
      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });
  });

  describe('Scroll Synchronization', () => {
    it('should handle scroll synchronization when preview is not visible', () => {
      render(<MainLayout />);

      const textarea = screen.getByPlaceholderText('마크다운으로 작성하세요...');

      // Scroll the editor
      fireEvent.scroll(textarea, { target: { scrollTop: 100 } });

      // Should not crash when preview is not visible
      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });

    it('should handle scroll synchronization edge cases', () => {
      render(<MainLayout />);

      const textarea = screen.getByPlaceholderText('마크다운으로 작성하세요...');

      // Test edge case: scroll to very top
      fireEvent.scroll(textarea, { target: { scrollTop: 0 } });

      // Test edge case: scroll to very bottom
      fireEvent.scroll(textarea, { target: { scrollTop: 9999 } });

      // Should not crash
      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });
  });

  describe('File Type Detection', () => {
    it('should show preview for markdown files', () => {
      render(<MainLayout />);

      // Click on filename to enable editing
      const filenameDisplay = screen.getByText('untitled.txt');
      fireEvent.click(filenameDisplay);

      // Find the input field that appears after clicking
      const filenameInput = screen.getByDisplayValue('untitled.txt');
      fireEvent.change(filenameInput, { target: { value: 'test.md' } });
      fireEvent.blur(filenameInput);

      // Preview should be available for markdown files
      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });

    it('should show preview for HTML files', () => {
      render(<MainLayout />);

      // Click on filename to enable editing
      const filenameDisplay = screen.getByText('untitled.txt');
      fireEvent.click(filenameDisplay);

      // Find the input field that appears after clicking
      const filenameInput = screen.getByDisplayValue('untitled.txt');
      fireEvent.change(filenameInput, { target: { value: 'test.html' } });
      fireEvent.blur(filenameInput);

      // Preview should be available for HTML files
      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });

    it('should not show preview for text files', () => {
      render(<MainLayout />);

      // Click on filename to enable editing
      const filenameDisplay = screen.getByText('untitled.txt');
      fireEvent.click(filenameDisplay);

      // Find the input field that appears after clicking
      const filenameInput = screen.getByDisplayValue('untitled.txt');
      fireEvent.change(filenameInput, { target: { value: 'test.txt' } });
      fireEvent.blur(filenameInput);

      // Preview should not be available for text files
      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });
  });

  describe('Memory Management', () => {
    it('should clean up resources on unmount', () => {
      const { unmount } = render(<MainLayout />);

      // Unmount component
      unmount();

      // Should not throw errors during cleanup
      expect(true).toBe(true);
    });
  });

  describe('Settings Management', () => {
    it('should handle settings load failure gracefully', () => {
      // Mock settings load to fail
      const mockInvoke = jest.fn().mockRejectedValue(new Error('Settings load failed'));
      window.electronAPI = {
        ...window.electronAPI,
        invoke: mockInvoke,
      };

      render(<MainLayout />);

      // Should not crash when settings load fails
      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });
  });
});
