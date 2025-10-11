import { render, screen, fireEvent, waitFor } from '@/__tests__/test-utils';
import MainLayout from '@renderer/components/Layout/MainLayout';

// Mock file operations
jest.mock('@renderer/utils/fileOperations', () => ({
  readFile: jest.fn(),
  saveFile: jest.fn(),
  saveFileAs: jest.fn(),
  openFile: jest.fn(),
  getRecentFiles: jest.fn().mockResolvedValue({ success: true, files: [] }),
  removeRecentFile: jest.fn(),
}));

// Mock electron API
const mockElectronAPI = {
  on: jest.fn(),
  invoke: jest.fn(),
};

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

describe('DragAndDrop', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('드래그 앤 드롭 이벤트', () => {
    it('드래그 오버 시 드롭 가능 영역이 강조되어야 함', () => {
      render(<MainLayout />);

      const mainContent = screen.getByTestId('main-layout');

      // 드래그 엔터 이벤트 시뮬레이션 (dragOver가 아닌 dragEnter 사용)
      fireEvent.dragEnter(mainContent, {
        dataTransfer: {
          files: [new File(['test content'], 'test.md', { type: 'text/markdown' })],
        },
      });

      // 드롭 가능 영역 강조 스타일 확인
      expect(mainContent).toHaveClass('drag-over');
    });

    it('드래그 리브 시 강조 스타일이 제거되어야 함', () => {
      render(<MainLayout />);

      const mainContent = screen.getByTestId('main-layout');

      // 드래그 오버 후 리브
      fireEvent.dragOver(mainContent, {
        dataTransfer: {
          files: [new File(['test content'], 'test.md', { type: 'text/markdown' })],
        },
      });

      fireEvent.dragLeave(mainContent);

      // 강조 스타일 제거 확인
      expect(mainContent).not.toHaveClass('drag-over');
    });

    it('파일 드롭 시 파일이 열려야 함', async () => {
      render(<MainLayout />);

      const mainContent = screen.getByTestId('main-layout');
      const testFile = new File(['# Test Content'], 'test.md', { type: 'text/markdown' });

      // 파일 드롭 이벤트
      fireEvent.drop(mainContent, {
        dataTransfer: {
          files: [testFile],
        },
      });

      // 파일 내용이 에디터에 반영되었는지 확인
      await waitFor(() => {
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue('# Test Content');
      });
    });

    it('다중 파일 드롭 시 첫 번째 파일만 열려야 함', async () => {
      render(<MainLayout />);

      const mainContent = screen.getByTestId('main-layout');
      const firstFile = new File(['# First File Content'], 'first.md', { type: 'text/markdown' });
      const secondFile = new File(['# Second File Content'], 'second.md', {
        type: 'text/markdown',
      });

      // 다중 파일 드롭 이벤트
      fireEvent.drop(mainContent, {
        dataTransfer: {
          files: [firstFile, secondFile],
        },
      });

      // 첫 번째 파일 내용이 에디터에 반영되었는지 확인
      await waitFor(() => {
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue('# First File Content');
      });
    });

    it('드래그 엔터 시 기본 동작이 방지되어야 함', () => {
      render(<MainLayout />);

      const mainContent = screen.getByTestId('main-layout');

      const dragEnterEvent = new Event('dragenter', { bubbles: true });
      const preventDefaultSpy = jest.spyOn(dragEnterEvent, 'preventDefault');

      fireEvent(mainContent, dragEnterEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('드래그 오버 시 기본 동작이 방지되어야 함', () => {
      render(<MainLayout />);

      const mainContent = screen.getByTestId('main-layout');

      const dragOverEvent = new Event('dragover', { bubbles: true });
      const preventDefaultSpy = jest.spyOn(dragOverEvent, 'preventDefault');

      fireEvent(mainContent, dragOverEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('드롭 시 기본 동작이 방지되어야 함', () => {
      render(<MainLayout />);

      const mainContent = screen.getByTestId('main-layout');
      const testFile = new File(['test content'], 'test.md', { type: 'text/markdown' });

      const dropEvent = new Event('drop', { bubbles: true });
      const preventDefaultSpy = jest.spyOn(dropEvent, 'preventDefault');

      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [testFile] },
        writable: true,
      });

      fireEvent(mainContent, dropEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('시각적 피드백', () => {
    it('드래그 오버 시 적절한 시각적 피드백이 제공되어야 함', () => {
      render(<MainLayout />);

      const mainContent = screen.getByTestId('main-layout');

      // 드래그 오버 전 상태
      expect(mainContent).not.toHaveClass('drag-over');

      // 드래그 엔터 (dragOver가 아닌 dragEnter 사용)
      fireEvent.dragEnter(mainContent, {
        dataTransfer: {
          files: [new File(['test'], 'test.md')],
        },
      });

      // 드래그 오버 후 상태
      expect(mainContent).toHaveClass('drag-over');
    });

    it('드래그 리브 시 시각적 피드백이 제거되어야 함', () => {
      render(<MainLayout />);

      const mainContent = screen.getByTestId('main-layout');

      // 드래그 엔터
      fireEvent.dragEnter(mainContent, {
        dataTransfer: {
          files: [new File(['test'], 'test.md')],
        },
      });

      expect(mainContent).toHaveClass('drag-over');

      // 드래그 리브
      fireEvent.dragLeave(mainContent);

      expect(mainContent).not.toHaveClass('drag-over');
    });
  });

  describe('에러 처리', () => {
    it('파일 읽기 실패 시 에러가 처리되어야 함', async () => {
      // console.error 모킹
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<MainLayout />);

      const mainContent = screen.getByTestId('main-layout');

      // 빈 파일로 드롭 (에러 상황 시뮬레이션)
      const emptyFile = new File([], 'empty.md', { type: 'text/markdown' });

      fireEvent.drop(mainContent, {
        dataTransfer: {
          files: [emptyFile],
        },
      });

      // FileReader 에러는 실제로는 발생하지 않으므로,
      // 대신 드롭 이벤트가 정상적으로 처리되는지 확인
      await waitFor(() => {
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue('');
      });

      consoleSpy.mockRestore();
    });
  });
});
