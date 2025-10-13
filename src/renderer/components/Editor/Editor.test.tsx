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
    it('should insert 4 spaces when Tab key is pressed at single cursor', () => {
      const { container } = render(<Editor />);
      const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

      // Tab 키 입력
      fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab' });

      // 4 스페이스가 삽입되어야 함
      expect(textarea.value).toBe('    ');
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

      expect(textarea.value).toBe('He    llo');
    });

    it('should indent multiple selected lines with Tab', () => {
      const { container } = render(<Editor />);
      const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

      // 여러 줄 입력
      fireEvent.change(textarea, { target: { value: 'Line 1\nLine 2\nLine 3' } });

      // 모든 줄 선택
      textarea.setSelectionRange(0, 20);

      // Tab 키 입력
      fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab' });

      // 각 줄에 4 스페이스가 추가되어야 함
      expect(textarea.value).toBe('    Line 1\n    Line 2\n    Line 3');
    });

    it('should unindent multiple selected lines with Shift+Tab', () => {
      const { container } = render(<Editor />);
      const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

      // 들여쓰기된 여러 줄 입력
      fireEvent.change(textarea, { target: { value: '    Line 1\n    Line 2\n    Line 3' } });

      // 모든 줄 선택
      textarea.setSelectionRange(0, 32);

      // Shift+Tab 키 입력
      fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab', shiftKey: true });

      // 각 줄의 들여쓰기가 4 스페이스 제거되어야 함
      expect(textarea.value).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should unindent current line with Shift+Tab at single cursor', () => {
      const { container } = render(<Editor />);
      const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

      // 들여쓰기된 텍스트 입력
      fireEvent.change(textarea, { target: { value: '    Hello' } });

      // 커서를 줄 어딘가에 위치
      textarea.setSelectionRange(5, 5);

      // Shift+Tab 키 입력
      fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab', shiftKey: true });

      // 4 스페이스가 제거되어야 함
      expect(textarea.value).toBe('Hello');
    });

    it('should handle partial indentation removal with Shift+Tab', () => {
      const { container } = render(<Editor />);
      const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

      // 2 스페이스만 들여쓰기된 텍스트 입력
      fireEvent.change(textarea, { target: { value: '  Hello' } });

      // 커서를 줄 어딘가에 위치
      textarea.setSelectionRange(3, 3);

      // Shift+Tab 키 입력
      fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab', shiftKey: true });

      // 2 스페이스만 제거되어야 함
      expect(textarea.value).toBe('Hello');
    });

    it('should do nothing with Shift+Tab on non-indented line', () => {
      const { container } = render(<Editor />);
      const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

      // 들여쓰기 없는 텍스트 입력
      fireEvent.change(textarea, { target: { value: 'Hello' } });

      // 커서를 줄 어딘가에 위치
      textarea.setSelectionRange(2, 2);

      // Shift+Tab 키 입력
      fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab', shiftKey: true });

      // 값이 변하지 않아야 함
      expect(textarea.value).toBe('Hello');
    });
  });

  describe('Auto indentation', () => {
    it('should maintain indentation on Enter key for .txt files', () => {
      const { container } = render(<Editor fileName="test.txt" />);
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
      const { container } = render(<Editor fileName="test.txt" />);
      const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: '    Nested' } });
      textarea.setSelectionRange(10, 10);

      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

      expect(textarea.value).toBe('    Nested\n    ');
    });

    it('should not add extra indentation for line without indent', () => {
      const { container } = render(<Editor fileName="test.txt" />);
      const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: 'No indent' } });
      textarea.setSelectionRange(9, 9);

      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

      // 들여쓰기가 없으면 preventDefault가 호출되지 않음
      // 따라서 값은 변하지 않음 (브라우저 기본 동작으로 처리됨)
      expect(textarea.value).toBe('No indent');
    });
  });

  describe('Markdown list auto-continuation (.md files)', () => {
    describe('Unordered lists', () => {
      it('should auto-continue unordered list with -', () => {
        const { container } = render(<Editor fileName="test.md" />);
        const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

        fireEvent.change(textarea, { target: { value: '- First item' } });
        textarea.setSelectionRange(12, 12);

        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

        expect(textarea.value).toBe('- First item\n- ');
      });

      it('should auto-continue unordered list with *', () => {
        const { container } = render(<Editor fileName="test.md" />);
        const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

        fireEvent.change(textarea, { target: { value: '* Item' } });
        textarea.setSelectionRange(6, 6);

        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

        expect(textarea.value).toBe('* Item\n* ');
      });

      it('should auto-continue unordered list with +', () => {
        const { container } = render(<Editor fileName="test.md" />);
        const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

        fireEvent.change(textarea, { target: { value: '+ Item' } });
        textarea.setSelectionRange(6, 6);

        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

        expect(textarea.value).toBe('+ Item\n+ ');
      });

      it('should preserve indentation in nested list', () => {
        const { container } = render(<Editor fileName="test.md" />);
        const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

        fireEvent.change(textarea, { target: { value: '  - Nested item' } });
        textarea.setSelectionRange(15, 15);

        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

        expect(textarea.value).toBe('  - Nested item\n  - ');
      });

      it('should exit list on empty item', () => {
        const { container } = render(<Editor fileName="test.md" />);
        const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

        fireEvent.change(textarea, { target: { value: '- ' } });
        textarea.setSelectionRange(2, 2);

        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

        expect(textarea.value).toBe('\n');
      });
    });

    describe('Ordered lists', () => {
      it('should auto-continue and increment ordered list', () => {
        const { container } = render(<Editor fileName="test.md" />);
        const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

        fireEvent.change(textarea, { target: { value: '1. First item' } });
        textarea.setSelectionRange(13, 13);

        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

        expect(textarea.value).toBe('1. First item\n2. ');
      });

      it('should increment from any number', () => {
        const { container } = render(<Editor fileName="test.md" />);
        const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

        fireEvent.change(textarea, { target: { value: '5. Fifth item' } });
        textarea.setSelectionRange(13, 13);

        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

        expect(textarea.value).toBe('5. Fifth item\n6. ');
      });

      it('should preserve indentation and increment', () => {
        const { container } = render(<Editor fileName="test.md" />);
        const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

        fireEvent.change(textarea, { target: { value: '    2. Nested' } });
        textarea.setSelectionRange(14, 14);

        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

        expect(textarea.value).toBe('    2. Nested\n    3. ');
      });

      it('should exit list on empty item', () => {
        const { container } = render(<Editor fileName="test.md" />);
        const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

        fireEvent.change(textarea, { target: { value: '1. ' } });
        textarea.setSelectionRange(3, 3);

        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

        expect(textarea.value).toBe('\n');
      });
    });

    describe('Checkboxes', () => {
      it('should auto-continue unchecked checkbox', () => {
        const { container } = render(<Editor fileName="test.md" />);
        const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

        fireEvent.change(textarea, { target: { value: '- [ ] Todo item' } });
        textarea.setSelectionRange(15, 15);

        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

        expect(textarea.value).toBe('- [ ] Todo item\n- [ ] ');
      });

      it('should auto-continue with unchecked box even if previous was checked', () => {
        const { container } = render(<Editor fileName="test.md" />);
        const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

        fireEvent.change(textarea, { target: { value: '- [x] Done item' } });
        textarea.setSelectionRange(15, 15);

        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

        expect(textarea.value).toBe('- [x] Done item\n- [ ] ');
      });

      it('should exit checkbox list on empty item', () => {
        const { container } = render(<Editor fileName="test.md" />);
        const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

        fireEvent.change(textarea, { target: { value: '- [ ] ' } });
        textarea.setSelectionRange(6, 6);

        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

        expect(textarea.value).toBe('\n');
      });
    });

    describe('Blockquotes', () => {
      it('should auto-continue blockquote', () => {
        const { container } = render(<Editor fileName="test.md" />);
        const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

        fireEvent.change(textarea, { target: { value: '> Quote text' } });
        textarea.setSelectionRange(12, 12);

        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

        expect(textarea.value).toBe('> Quote text\n> ');
      });

      it('should preserve indentation in nested blockquote', () => {
        const { container } = render(<Editor fileName="test.md" />);
        const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

        fireEvent.change(textarea, { target: { value: '  > Nested quote' } });
        textarea.setSelectionRange(16, 16);

        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

        expect(textarea.value).toBe('  > Nested quote\n  > ');
      });

      it('should exit blockquote on empty line', () => {
        const { container } = render(<Editor fileName="test.md" />);
        const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

        fireEvent.change(textarea, { target: { value: '> ' } });
        textarea.setSelectionRange(2, 2);

        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

        expect(textarea.value).toBe('\n');
      });
    });

    describe('File type detection', () => {
      it('should enable markdown features for .md files', () => {
        const { container } = render(<Editor fileName="test.md" />);
        const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

        fireEvent.change(textarea, { target: { value: '- Item' } });
        textarea.setSelectionRange(6, 6);

        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

        expect(textarea.value).toBe('- Item\n- ');
      });

      it('should enable markdown features for .markdown files', () => {
        const { container } = render(<Editor fileName="test.markdown" />);
        const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

        fireEvent.change(textarea, { target: { value: '- Item' } });
        textarea.setSelectionRange(6, 6);

        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

        expect(textarea.value).toBe('- Item\n- ');
      });

      it('should NOT enable markdown features for .txt files', () => {
        const { container } = render(<Editor fileName="test.txt" />);
        const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

        fireEvent.change(textarea, { target: { value: '- Item' } });
        textarea.setSelectionRange(6, 6);

        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

        // 마크다운 기능 비활성화 → 일반 Enter 동작 (값 변화 없음)
        expect(textarea.value).toBe('- Item');
      });

      it('should enable markdown features when no fileName is provided', () => {
        const { container } = render(<Editor />);
        const textarea = container.querySelector('.editor-textarea') as HTMLTextAreaElement;

        fireEvent.change(textarea, { target: { value: '- Item' } });
        textarea.setSelectionRange(6, 6);

        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

        // fileName이 없으면 마크다운 모드로 동작
        expect(textarea.value).toBe('- Item\n- ');
      });
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
