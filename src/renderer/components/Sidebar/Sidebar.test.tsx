import { render, screen, fireEvent, waitFor } from '@/__tests__/test-utils';
import Sidebar from './Sidebar';

describe('Sidebar', () => {
  it('should render without crashing', () => {
    render(<Sidebar />);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('should display current filename', () => {
    render(<Sidebar currentFileName="test.md" />);
    expect(screen.getByText('test.md')).toBeInTheDocument();
  });

  it('should display asterisk when file is modified', () => {
    render(<Sidebar currentFileName="test.md" isDirty={true} />);
    expect(screen.getByText('test.md *')).toBeInTheDocument();
  });

  it('should not display asterisk when file is not modified', () => {
    render(<Sidebar currentFileName="test.md" isDirty={false} />);
    expect(screen.getByText('test.md')).toBeInTheDocument();
    expect(screen.queryByText('test.md *')).not.toBeInTheDocument();
  });

  it('should display default filename when not provided', () => {
    render(<Sidebar />);
    expect(screen.getByText('untitled.md')).toBeInTheDocument();
  });

  it('should display sidebar header below filename', () => {
    render(<Sidebar />);
    expect(screen.getByRole('heading', { name: /최근 문서/i })).toBeInTheDocument();
  });

  it('should enable filename editing on click', () => {
    render(<Sidebar currentFileName="test.md" />);
    const filename = screen.getByText('test.md');

    // 파일명 클릭
    fireEvent.click(filename);

    // 입력 필드로 변경되어야 함
    const input = screen.getByDisplayValue('test.md');
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it('should save filename on Enter key', async () => {
    const handleFileNameChange = jest.fn();
    render(<Sidebar currentFileName="test.md" onFileNameChange={handleFileNameChange} />);

    const filename = screen.getByText('test.md');
    fireEvent.click(filename);

    const input = screen.getByDisplayValue('test.md');
    fireEvent.change(input, { target: { value: 'newfile.md' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(handleFileNameChange).toHaveBeenCalledWith('newfile.md');
    });
  });

  it('should cancel filename editing on Escape key', () => {
    render(<Sidebar currentFileName="test.md" />);

    const filename = screen.getByText('test.md');
    fireEvent.click(filename);

    const input = screen.getByDisplayValue('test.md');
    fireEvent.change(input, { target: { value: 'newfile.md' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    // 원래 파일명으로 돌아가야 함
    expect(screen.getByText('test.md')).toBeInTheDocument();
  });

  it('should save filename on blur', async () => {
    const handleFileNameChange = jest.fn();
    render(<Sidebar currentFileName="test.md" onFileNameChange={handleFileNameChange} />);

    const filename = screen.getByText('test.md');
    fireEvent.click(filename);

    const input = screen.getByDisplayValue('test.md');
    fireEvent.change(input, { target: { value: 'newfile.md' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(handleFileNameChange).toHaveBeenCalledWith('newfile.md');
    });
  });

  it('should reject invalid filename with illegal characters', () => {
    const handleFileNameChange = jest.fn();
    render(<Sidebar currentFileName="test.md" onFileNameChange={handleFileNameChange} />);

    const filename = screen.getByText('test.md');
    fireEvent.click(filename);

    const input = screen.getByDisplayValue('test.md');
    fireEvent.change(input, { target: { value: 'file/name.md' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // 잘못된 파일명이므로 onChange가 호출되지 않아야 함
    expect(handleFileNameChange).not.toHaveBeenCalled();
    // 오류 메시지가 표시되어야 함
    expect(screen.getByText(/사용할 수 없는 문자/)).toBeInTheDocument();
  });

  it('should reject empty filename', () => {
    const handleFileNameChange = jest.fn();
    render(<Sidebar currentFileName="test.md" onFileNameChange={handleFileNameChange} />);

    const filename = screen.getByText('test.md');
    fireEvent.click(filename);

    const input = screen.getByDisplayValue('test.md');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleFileNameChange).not.toHaveBeenCalled();
    expect(screen.getByText(/파일명을 입력해주세요/)).toBeInTheDocument();
  });

  it('should accept valid filename changes', () => {
    const handleFileNameChange = jest.fn();
    render(<Sidebar currentFileName="test.md" onFileNameChange={handleFileNameChange} />);

    const filename = screen.getByText('test.md');
    fireEvent.click(filename);

    const input = screen.getByDisplayValue('test.md');
    fireEvent.change(input, { target: { value: 'valid-name.md' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleFileNameChange).toHaveBeenCalledWith('valid-name.md');
  });

  it('should have toggle button', () => {
    render(<Sidebar />);
    const toggleButton = screen.getByTitle('접기/펼치기');
    expect(toggleButton).toBeInTheDocument();
  });

  it('should have refresh button', () => {
    render(<Sidebar />);
    const refreshButton = screen.getByTitle('새로고침');
    expect(refreshButton).toBeInTheDocument();
  });

  it('should have delete button', () => {
    render(<Sidebar />);
    const deleteButton = screen.getByTitle('삭제');
    expect(deleteButton).toBeInTheDocument();
  });

  it('should toggle sidebar when clicking toggle button', () => {
    render(<Sidebar />);
    const sidebar = screen.getByTestId('sidebar');
    const toggleButton = screen.getByTitle('접기/펼치기');

    // 초기 상태 확인
    expect(sidebar).not.toHaveClass('collapsed');

    // 토글 클릭
    fireEvent.click(toggleButton);
    expect(sidebar).toHaveClass('collapsed');

    // 다시 토글
    fireEvent.click(toggleButton);
    expect(sidebar).not.toHaveClass('collapsed');
  });

  it('should display file list area', () => {
    render(<Sidebar />);
    expect(screen.getByTestId('file-list')).toBeInTheDocument();
  });
});
