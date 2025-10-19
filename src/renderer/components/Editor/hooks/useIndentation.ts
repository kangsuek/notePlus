import { useCallback } from 'react';

export interface UseIndentationProps {
  text: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onTextChange: (newText: string, cursorPos?: number) => void;
  fileName?: string;
}

export function useIndentation({ text, textareaRef, onTextChange, fileName }: UseIndentationProps) {
  // Check if markdown features should be enabled
  const isMarkdownEnabled = useCallback(() => {
    if (!fileName) return true; // Default to enabled if no filename
    const ext = fileName.toLowerCase().split('.').pop();
    return ext === 'md' || ext === 'markdown';
  }, [fileName]);

  // Handle Tab key for indentation
  const handleTabKey = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!textareaRef.current) return;

      const { selectionStart, selectionEnd } = textareaRef.current;
      const selectedText = text.substring(selectionStart, selectionEnd);

      if (e.key === 'Tab') {
        e.preventDefault();

        if (selectedText) {
          // Multiple lines selected - indent/unindent all
          const lines = text.split('\n');
          let currentLineStart = 0;
          let startLineIndex = 0;
          let endLineIndex = 0;

          // Find which lines are selected
          for (let i = 0; i < lines.length; i++) {
            const lineEnd = currentLineStart + lines[i].length;
            if (currentLineStart <= selectionStart && selectionStart <= lineEnd) {
              startLineIndex = i;
            }
            if (currentLineStart <= selectionEnd && selectionEnd <= lineEnd) {
              endLineIndex = i;
              break;
            }
            currentLineStart = lineEnd + 1; // +1 for newline
          }

          if (e.shiftKey) {
            // Unindent
            for (let i = startLineIndex; i <= endLineIndex; i++) {
              if (lines[i].startsWith('    ')) {
                lines[i] = lines[i].substring(4);
              } else if (lines[i].startsWith('  ')) {
                lines[i] = lines[i].substring(2);
              }
            }
          } else {
            // Indent
            for (let i = startLineIndex; i <= endLineIndex; i++) {
              lines[i] = '    ' + lines[i];
            }
          }

          const newText = lines.join('\n');
          onTextChange(newText);
        } else {
          // Single cursor - insert spaces
          if (e.shiftKey) {
            // Unindent current line
            const lines = text.split('\n');
            let currentLineStart = 0;
            let currentLineIndex = 0;

            for (let i = 0; i < lines.length; i++) {
              const lineEnd = currentLineStart + lines[i].length;
              if (currentLineStart <= selectionStart && selectionStart <= lineEnd) {
                currentLineIndex = i;
                break;
              }
              currentLineStart = lineEnd + 1;
            }

            const currentLine = lines[currentLineIndex];
            if (currentLine.startsWith('    ')) {
              lines[currentLineIndex] = currentLine.substring(4);
              const newText = lines.join('\n');
              onTextChange(newText, Math.max(0, selectionStart - 4));
            } else if (currentLine.startsWith('  ')) {
              lines[currentLineIndex] = currentLine.substring(2);
              const newText = lines.join('\n');
              onTextChange(newText, Math.max(0, selectionStart - 2));
            }
          } else {
            // Insert 4 spaces
            const newText =
              text.substring(0, selectionStart) + '    ' + text.substring(selectionStart);
            onTextChange(newText, selectionStart + 4);
          }
        }
      }
    },
    [text, textareaRef, onTextChange]
  );

  // Handle Enter key for auto-indentation
  const handleEnterKey = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!textareaRef.current) return;

      const { selectionStart } = textareaRef.current;
      const lines = text.substring(0, selectionStart).split('\n');
      const currentLine = lines[lines.length - 1];

      // Auto-indentation for non-markdown files or when markdown features are disabled
      if (!isMarkdownEnabled()) {
        e.preventDefault();

        // Find indentation of current line
        const match = currentLine.match(/^(\s*)/);
        const indentation = match ? match[1] : '';

        const newText =
          text.substring(0, selectionStart) + '\n' + indentation + text.substring(selectionStart);
        onTextChange(newText, selectionStart + 1 + indentation.length);
      }
    },
    [text, textareaRef, onTextChange, isMarkdownEnabled]
  );

  return {
    handleTabKey,
    handleEnterKey,
  };
}
