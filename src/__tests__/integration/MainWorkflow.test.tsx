/**
 * 메인 워크플로우 통합 테스트
 *
 * 사용자의 주요 작업 흐름을 테스트합니다:
 * 1. 파일 생성 → 편집 → 저장
 * 2. 수식 계산
 * 3. 최근 문서 관리
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MainLayout from '@renderer/components/Layout/MainLayout';

// Mock electron API
const mockInvoke = jest.fn();
window.electronAPI = {
  invoke: mockInvoke,
  send: jest.fn(),
  on: jest.fn(),
  platform: 'darwin',
};

describe('메인 워크플로우 통합 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('파일 생성 → 편집 → 저장 플로우', () => {
    it('should allow user to create, edit, and save a file', async () => {
      // 1. 앱 렌더링
      render(<MainLayout />);

      // 2. Editor에 텍스트 입력
      const editor = screen.getByPlaceholderText('마크다운으로 작성하세요...');
      expect(editor).toBeInTheDocument();

      fireEvent.change(editor, { target: { value: '# Hello World\n\nThis is a test.' } });

      // 3. isDirty 상태 확인 (파일명에 * 표시)
      await waitFor(() => {
        const fileNameDisplay = screen.getByText(/untitled\.md \*/);
        expect(fileNameDisplay).toBeInTheDocument();
      });

      // 4. 저장 다이얼로그 mock
      mockInvoke.mockResolvedValueOnce({
        canceled: false,
        filePath: '/path/to/test.md',
      });

      // 5. 파일 저장 mock
      mockInvoke.mockResolvedValueOnce({
        success: true,
      });

      // 6. Cmd+S (저장)
      fireEvent.keyDown(window, { key: 's', metaKey: true });

      // 7. 저장 후 isDirty 해제 확인
      await waitFor(() => {
        const fileNameDisplay = screen.getByText(/test\.md$/);
        expect(fileNameDisplay).toBeInTheDocument();
        expect(fileNameDisplay).not.toHaveTextContent('*');
      });
    });
  });

  describe('수식 계산 플로우', () => {
    it('should calculate expressions when = is typed', async () => {
      render(<MainLayout />);

      const editor = screen.getByPlaceholderText('마크다운으로 작성하세요...');

      // 수식 입력
      fireEvent.change(editor, { target: { value: '2 + 3' } });

      // 커서를 끝으로 이동
      (editor as HTMLTextAreaElement).selectionStart = (editor as HTMLTextAreaElement).value.length;
      (editor as HTMLTextAreaElement).selectionEnd = (editor as HTMLTextAreaElement).value.length;

      // = 키 입력
      fireEvent.keyDown(editor, { key: '=' });

      // 계산 결과 확인
      await waitFor(() => {
        expect((editor as HTMLTextAreaElement).value).toContain('2 + 3 = 5');
      });
    });

    it('should not calculate invalid expressions', () => {
      render(<MainLayout />);

      const editor = screen.getByPlaceholderText('마크다운으로 작성하세요...');

      // 잘못된 수식 입력
      fireEvent.change(editor, { target: { value: '2 + +' } });

      // 커서를 끝으로 이동
      (editor as HTMLTextAreaElement).selectionStart = (editor as HTMLTextAreaElement).value.length;
      (editor as HTMLTextAreaElement).selectionEnd = (editor as HTMLTextAreaElement).value.length;

      // = 키 입력
      fireEvent.keyDown(editor, { key: '=' });

      // handleEquals가 return하므로 preventDefault가 호출되지 않음
      // 하지만 fireEvent는 기본 동작을 실행하지 않으므로 값은 그대로
      expect((editor as HTMLTextAreaElement).value).toBe('2 + +');
    });

    it('should not calculate plain numbers', () => {
      render(<MainLayout />);

      const editor = screen.getByPlaceholderText('마크다운으로 작성하세요...');

      // 숫자만 입력
      fireEvent.change(editor, { target: { value: '123' } });

      // 커서를 끝으로 이동
      (editor as HTMLTextAreaElement).selectionStart = (editor as HTMLTextAreaElement).value.length;
      (editor as HTMLTextAreaElement).selectionEnd = (editor as HTMLTextAreaElement).value.length;

      // = 키 입력
      fireEvent.keyDown(editor, { key: '=' });

      // handleEquals가 return하므로 preventDefault가 호출되지 않음
      // 하지만 fireEvent는 기본 동작을 실행하지 않으므로 값은 그대로
      expect((editor as HTMLTextAreaElement).value).toBe('123');
    });
  });

  describe('최근 문서 관리 플로우', () => {
    it('should display recent files', async () => {
      // 최근 파일 목록 mock
      mockInvoke.mockResolvedValueOnce({
        success: true,
        files: [
          { path: '/path/to/file1.md', lastOpened: new Date().toISOString() },
          { path: '/path/to/file2.md', lastOpened: new Date().toISOString() },
        ],
      });

      render(<MainLayout />);

      // 최근 문서 헤더 확인
      await waitFor(() => {
        const header = screen.getByText(/최근 문서 \(2\)/);
        expect(header).toBeInTheDocument();
      });

      // 파일 목록 확인
      await waitFor(() => {
        expect(screen.getByText('file1.md')).toBeInTheDocument();
        expect(screen.getByText('file2.md')).toBeInTheDocument();
      });
    });

    it('should open file when clicked', async () => {
      // 최근 파일 목록 mock
      mockInvoke.mockResolvedValueOnce({
        success: true,
        files: [{ path: '/path/to/file1.md', lastOpened: new Date().toISOString() }],
      });

      // 파일 읽기 mock
      mockInvoke.mockResolvedValueOnce({
        success: true,
        content: '# File 1 Content',
      });

      render(<MainLayout />);

      // 파일 싱글클릭
      await waitFor(() => {
        const fileItem = screen.getByText('file1.md');
        expect(fileItem).toBeInTheDocument();
        fireEvent.click(fileItem);
      });

      // Editor에 파일 내용이 로드되어야 함
      await waitFor(() => {
        const editor = screen.getByPlaceholderText('마크다운으로 작성하세요...');
        expect((editor as HTMLTextAreaElement).value).toBe('# File 1 Content');
      });
    });
  });

  describe('마크다운 프리뷰 플로우', () => {
    it('should render markdown preview in real-time', async () => {
      render(<MainLayout />);

      const editor = screen.getByPlaceholderText('마크다운으로 작성하세요...');

      // 마크다운 입력
      fireEvent.change(editor, { target: { value: '# Hello\n\n**Bold Text**' } });

      // 프리뷰 확인
      await waitFor(() => {
        const preview = screen.getByTestId('markdown-preview');
        expect(preview).toBeInTheDocument();
        expect(preview).toContainHTML('<h1>Hello</h1>');
        expect(preview).toContainHTML('<strong>Bold Text</strong>');
      });
    });
  });

  describe('커서 위치 표시 플로우', () => {
    it('should display cursor position in status bar', async () => {
      render(<MainLayout />);

      const editor = screen.getByPlaceholderText('마크다운으로 작성하세요...');

      // 텍스트 입력
      fireEvent.change(editor, { target: { value: 'Line 1\nLine 2' } });

      // 커서를 두 번째 줄로 이동 (Line 2의 시작 = 인덱스 7)
      (editor as HTMLTextAreaElement).selectionStart = 7;
      (editor as HTMLTextAreaElement).selectionEnd = 7;
      fireEvent.click(editor);

      // StatusBar에서 커서 위치 확인 (줄 2, 칸 1)
      await waitFor(() => {
        const statusBar = screen.getByTestId('status-bar');
        expect(statusBar).toHaveTextContent(/줄 2, 칸 1/);
      });
    });
  });
});
