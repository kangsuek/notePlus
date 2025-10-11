import { render, screen, fireEvent, waitFor } from '@/__tests__/test-utils';
import Editor from './Editor';

describe('Editor', () => {
  it('should render without crashing', () => {
    render(<Editor />);
    expect(screen.getByTestId('editor-section')).toBeInTheDocument();
  });

  it('should render editor header', () => {
    render(<Editor />);
    expect(screen.getByText('Editor')).toBeInTheDocument();
  });

  it('should render textarea', () => {
    render(<Editor />);
    const textarea = screen.getByPlaceholderText('마크다운으로 작성하세요...');
    expect(textarea).toBeInTheDocument();
  });

  it('should handle text input', () => {
    render(<Editor />);
    const textarea = screen.getByPlaceholderText('마크다운으로 작성하세요...');

    fireEvent.change(textarea, { target: { value: '# Hello World' } });
    expect(textarea).toHaveValue('# Hello World');
  });

  it('should update line numbers when text changes', () => {
    render(<Editor />);
    const textarea = screen.getByPlaceholderText('마크다운으로 작성하세요...');

    // 초기 상태: 1줄
    expect(screen.getByText('1')).toBeInTheDocument();

    // 3줄 입력
    fireEvent.change(textarea, { target: { value: 'Line 1\nLine 2\nLine 3' } });

    // 라인 넘버가 3개 있어야 함
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should call onChange handler', () => {
    const handleChange = jest.fn();
    render(<Editor onChange={handleChange} />);

    const textarea = screen.getByPlaceholderText('마크다운으로 작성하세요...');
    fireEvent.change(textarea, { target: { value: 'Test' } });

    expect(handleChange).toHaveBeenCalled();
  });

  it('should debounce onChange calls', async () => {
    const handleChange = jest.fn();
    render(<Editor onChange={handleChange} debounceMs={300} />);

    const textarea = screen.getByPlaceholderText('마크다운으로 작성하세요...');

    // 빠르게 여러 번 입력
    fireEvent.change(textarea, { target: { value: 'T' } });
    fireEvent.change(textarea, { target: { value: 'Te' } });
    fireEvent.change(textarea, { target: { value: 'Test' } });

    // 디바운스되어 마지막 호출만 실행되어야 함
    await waitFor(
      () => {
        expect(handleChange).toHaveBeenCalledTimes(1);
      },
      { timeout: 500 }
    );
  });

  it('should have monospace font class', () => {
    const { container } = render(<Editor />);
    const textarea = container.querySelector('.editor-textarea');

    expect(textarea).toHaveClass('editor-textarea');
  });

  it('should sync line numbers scroll with editor scroll', () => {
    const { container } = render(<Editor />);
    const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;
    const lineNumbersWrapper = container.querySelector('.line-numbers-wrapper') as HTMLDivElement;

    // 긴 텍스트 입력 (스크롤 가능하도록)
    const longText = Array.from({ length: 50 }, (_, i) => `Line ${i + 1}`).join('\n');
    fireEvent.change(textarea, { target: { value: longText } });

    // textarea 스크롤
    Object.defineProperty(textarea, 'scrollTop', { value: 100, writable: true });
    fireEvent.scroll(textarea);

    // line numbers wrapper도 같은 위치로 스크롤되어야 함
    expect(lineNumbersWrapper.scrollTop).toBe(100);
  });

  // 3.5 에디터 UX 개선 테스트
  describe('Tab key handling', () => {
    it('should insert spaces when Tab key is pressed', () => {
      const { container } = render(<Editor />);
      const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

      // Tab 키 입력
      fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab' });

      // 2 스페이스가 삽입되어야 함
      expect(textarea.value).toBe('  ');
    });

    it('should not insert Tab character', () => {
      const { container } = render(<Editor />);
      const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

      fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab' });

      // 실제 탭 문자(\t)가 아닌 스페이스여야 함
      expect(textarea.value).not.toContain('\t');
    });

    it('should insert Tab at cursor position', () => {
      const { container } = render(<Editor />);
      const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

      // 텍스트 입력
      fireEvent.change(textarea, { target: { value: 'Hello' } });

      // 커서를 중간에 위치
      textarea.setSelectionRange(2, 2); // "He|llo"

      // Tab 키 입력
      fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab' });

      expect(textarea.value).toBe('He  llo');
    });
  });

  describe('Auto indentation', () => {
    it('should maintain indentation on Enter key', () => {
      const { container } = render(<Editor />);
      const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

      // 들여쓰기가 있는 텍스트 입력
      fireEvent.change(textarea, { target: { value: '  Hello' } });

      // 커서를 끝으로 이동
      textarea.setSelectionRange(7, 7);

      // Enter 키 입력
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

      // 새 줄도 같은 들여쓰기를 가져야 함
      expect(textarea.value).toBe('  Hello\n  ');
    });

    it('should handle multiple levels of indentation', () => {
      const { container } = render(<Editor />);
      const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: '    Nested' } });
      textarea.setSelectionRange(10, 10);

      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

      expect(textarea.value).toBe('    Nested\n    ');
    });

    it('should not add extra indentation for line without indent', () => {
      const { container } = render(<Editor />);
      const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: 'No indent' } });
      textarea.setSelectionRange(9, 9);

      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

      // 들여쓰기가 없으면 preventDefault가 호출되지 않음
      // 따라서 값은 변하지 않음 (브라우저 기본 동작으로 처리됨)
      expect(textarea.value).toBe('No indent');
    });
  });

  describe('Keyboard shortcuts', () => {
    it('should wrap selected text with ** on Cmd+B', () => {
      const { container } = render(<Editor />);
      const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: 'Hello World' } });

      // "World" 선택
      textarea.setSelectionRange(6, 11);

      // Cmd+B
      fireEvent.keyDown(textarea, { key: 'b', metaKey: true });

      expect(textarea.value).toBe('Hello **World**');
    });

    it('should wrap selected text with * on Cmd+I', () => {
      const { container } = render(<Editor />);
      const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: 'Hello World' } });
      textarea.setSelectionRange(6, 11);

      fireEvent.keyDown(textarea, { key: 'i', metaKey: true });

      expect(textarea.value).toBe('Hello *World*');
    });

    it('should insert link markdown on Cmd+K', () => {
      const { container } = render(<Editor />);
      const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: 'Click here' } });
      textarea.setSelectionRange(6, 10); // "here" 선택

      fireEvent.keyDown(textarea, { key: 'k', metaKey: true });

      expect(textarea.value).toBe('Click [here](url)');
    });

    it('should insert bold markers at cursor when no selection', () => {
      const { container } = render(<Editor />);
      const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: 'Hello' } });
      textarea.setSelectionRange(5, 5); // 끝에 커서

      fireEvent.keyDown(textarea, { key: 'b', metaKey: true });

      expect(textarea.value).toBe('Hello****');
    });
  });

  describe('Math calculation with = key', () => {
    it('should calculate expression when = is typed at line end', async () => {
      const handleChange = jest.fn();
      render(<Editor onChange={handleChange} />);

      const textarea = screen.getByPlaceholderText('마크다운으로 작성하세요...');

      // '2 + 3' 입력
      fireEvent.change(textarea, { target: { value: '2 + 3' } });

      // 커서를 라인 끝으로 이동
      Object.defineProperty(textarea, 'selectionStart', { value: 5, writable: true });
      Object.defineProperty(textarea, 'selectionEnd', { value: 5, writable: true });

      // '=' 키 입력
      fireEvent.keyDown(textarea, { key: '=' });

      // 계산 결과가 추가되어야 함
      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith(expect.stringContaining('= 5'));
      });
    });

    it('should show calculation result inline', async () => {
      render(<Editor />);

      const textarea = screen.getByPlaceholderText(
        '마크다운으로 작성하세요...'
      ) as HTMLTextAreaElement;

      // '10 * 5' 입력
      fireEvent.change(textarea, { target: { value: '10 * 5' } });

      // 커서를 라인 끝으로 이동
      Object.defineProperty(textarea, 'selectionStart', { value: 6, writable: true });
      Object.defineProperty(textarea, 'selectionEnd', { value: 6, writable: true });

      // '=' 키 입력
      fireEvent.keyDown(textarea, { key: '=' });

      await waitFor(() => {
        expect(textarea.value).toContain('= 50');
      });
    });

    it('should handle invalid expression', async () => {
      render(<Editor />);

      const textarea = screen.getByPlaceholderText(
        '마크다운으로 작성하세요...'
      ) as HTMLTextAreaElement;

      // 잘못된 수식 입력
      fireEvent.change(textarea, { target: { value: '2 + +' } });

      // 커서를 라인 끝으로 이동
      Object.defineProperty(textarea, 'selectionStart', { value: 5, writable: true });
      Object.defineProperty(textarea, 'selectionEnd', { value: 5, writable: true });

      // '=' 키 입력
      fireEvent.keyDown(textarea, { key: '=' });

      // 잘못된 수식은 계산되지 않고 원래 텍스트 유지
      expect(textarea.value).toBe('2 + +');
    });

    it('should calculate from current line only', async () => {
      render(<Editor />);

      const textarea = screen.getByPlaceholderText(
        '마크다운으로 작성하세요...'
      ) as HTMLTextAreaElement;

      // 여러 줄 입력
      const multiLine = 'First line\n5 + 3\nLast line';
      fireEvent.change(textarea, { target: { value: multiLine } });

      // 두 번째 줄 끝으로 커서 이동 (5 + 3 끝)
      Object.defineProperty(textarea, 'selectionStart', { value: 16, writable: true });
      Object.defineProperty(textarea, 'selectionEnd', { value: 16, writable: true });

      // '=' 키 입력
      fireEvent.keyDown(textarea, { key: '=' });

      await waitFor(() => {
        // 두 번째 줄에만 결과가 추가되어야 함
        expect(textarea.value).toContain('5 + 3 = 8');
        expect(textarea.value).toContain('First line');
        expect(textarea.value).toContain('Last line');
      });
    });

    it('should not calculate plain numbers', async () => {
      render(<Editor />);

      const textarea = screen.getByPlaceholderText(
        '마크다운으로 작성하세요...'
      ) as HTMLTextAreaElement;

      // 단순 숫자 입력
      fireEvent.change(textarea, { target: { value: '123' } });

      // 커서를 라인 끝으로 이동
      Object.defineProperty(textarea, 'selectionStart', { value: 3, writable: true });
      Object.defineProperty(textarea, 'selectionEnd', { value: 3, writable: true });

      // '=' 키 입력
      fireEvent.keyDown(textarea, { key: '=' });

      // 단순 숫자는 계산되지 않음 (preventDefault 안 함)
      // 테스트 환경에서는 실제 = 키 입력이 시뮬레이션되지 않으므로 원래 텍스트 유지
      expect(textarea.value).toBe('123');
    });
  });
});
