import { render, screen } from '@/__tests__/test-utils';
import LineNumbers from './LineNumbers';
import type { LineWrapInfo } from '@renderer/types';

describe('LineNumbers', () => {
  it('should render without crashing', () => {
    const lineWraps: LineWrapInfo[] = [
      { logicalLineNumber: 1, isWrapped: false },
    ];
    render(<LineNumbers lineWraps={lineWraps} currentLine={1} />);
    expect(screen.getByTestId('line-numbers')).toBeInTheDocument();
  });

  it('should render correct number of lines', () => {
    const lineWraps: LineWrapInfo[] = [
      { logicalLineNumber: 1, isWrapped: false },
      { logicalLineNumber: 2, isWrapped: false },
      { logicalLineNumber: 3, isWrapped: false },
      { logicalLineNumber: 4, isWrapped: false },
      { logicalLineNumber: 5, isWrapped: false },
    ];
    render(<LineNumbers lineWraps={lineWraps} currentLine={1} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should highlight current line', () => {
    const lineWraps: LineWrapInfo[] = [
      { logicalLineNumber: 1, isWrapped: false },
      { logicalLineNumber: 2, isWrapped: false },
      { logicalLineNumber: 3, isWrapped: false },
      { logicalLineNumber: 4, isWrapped: false },
      { logicalLineNumber: 5, isWrapped: false },
    ];
    render(<LineNumbers lineWraps={lineWraps} currentLine={3} />);

    const line3 = screen.getByTestId('line-number-3');
    expect(line3).toHaveClass('line-number-active');
  });

  it('should render empty line numbers for wrapped lines', () => {
    const lineWraps: LineWrapInfo[] = [
      { logicalLineNumber: 1, isWrapped: false },
      { logicalLineNumber: 2, isWrapped: false },
      { logicalLineNumber: 2, isWrapped: true }, // 자동 줄바꿈된 줄
      { logicalLineNumber: 2, isWrapped: true }, // 자동 줄바꿈된 줄
      { logicalLineNumber: 3, isWrapped: false },
    ];
    render(<LineNumbers lineWraps={lineWraps} currentLine={1} />);

    // 논리적 줄번호만 표시되어야 함
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // 자동 줄바꿈된 줄은 빈칸이어야 함
    const wrappedLines = screen.getAllByTestId(/line-number-wrapped/);
    expect(wrappedLines).toHaveLength(2);
    wrappedLines.forEach((line) => {
      expect(line.textContent).toBe('');
    });
  });

  it('should only highlight the first visual line of current logical line', () => {
    const lineWraps: LineWrapInfo[] = [
      { logicalLineNumber: 1, isWrapped: false },
      { logicalLineNumber: 2, isWrapped: false },
      { logicalLineNumber: 2, isWrapped: true }, // 자동 줄바꿈
      { logicalLineNumber: 3, isWrapped: false },
    ];
    render(<LineNumbers lineWraps={lineWraps} currentLine={2} />);

    // 논리적 줄 2의 첫 번째 시각적 줄만 하이라이트
    const line2 = screen.getByTestId('line-number-2');
    expect(line2).toHaveClass('line-number-active');

    // 자동 줄바꿈된 줄은 하이라이트 안 됨
    const wrappedLine = screen.getByTestId('line-number-wrapped-2');
    expect(wrappedLine).not.toHaveClass('line-number-active');
  });

  it('should update when lineWraps changes', () => {
    const initialLineWraps: LineWrapInfo[] = [
      { logicalLineNumber: 1, isWrapped: false },
      { logicalLineNumber: 2, isWrapped: false },
    ];
    const { rerender } = render(<LineNumbers lineWraps={initialLineWraps} currentLine={1} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.queryByText('3')).not.toBeInTheDocument();

    // lineWraps 변경
    const newLineWraps: LineWrapInfo[] = [
      { logicalLineNumber: 1, isWrapped: false },
      { logicalLineNumber: 2, isWrapped: false },
      { logicalLineNumber: 2, isWrapped: true },
      { logicalLineNumber: 3, isWrapped: false },
    ];
    rerender(<LineNumbers lineWraps={newLineWraps} currentLine={1} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

