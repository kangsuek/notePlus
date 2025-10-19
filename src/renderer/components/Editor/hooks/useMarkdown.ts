import { useCallback } from 'react';
import {
  parseMarkdownList,
  isEmptyListItem,
  generateNextListItem,
  removeEmptyListItem,
} from '@renderer/utils/markdownListUtils';

export interface UseMarkdownProps {
  text: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onTextChange: (newText: string, cursorPos?: number) => void;
  fileName?: string;
}

export function useMarkdown({ text, textareaRef, onTextChange, fileName }: UseMarkdownProps) {
  // Check if markdown features should be enabled
  const isMarkdownEnabled = useCallback(() => {
    if (!fileName) return true; // Default to enabled if no filename
    const ext = fileName.toLowerCase().split('.').pop();
    return ext === 'md' || ext === 'markdown';
  }, [fileName]);

  // Handle markdown shortcuts (Cmd+B, Cmd+I, Cmd+K)
  const handleMarkdownShortcut = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!textareaRef.current) return;

      const { selectionStart, selectionEnd } = textareaRef.current;
      const selectedText = text.substring(selectionStart, selectionEnd);

      if (e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b': // Bold
            e.preventDefault();
            if (selectedText) {
              const newText =
                text.substring(0, selectionStart) +
                `**${selectedText}**` +
                text.substring(selectionEnd);
              onTextChange(newText, selectionStart + 2);
            } else {
              const newText =
                text.substring(0, selectionStart) + '****' + text.substring(selectionStart);
              onTextChange(newText, selectionStart + 2);
            }
            break;

          case 'i': // Italic
            e.preventDefault();
            if (selectedText) {
              const newText =
                text.substring(0, selectionStart) +
                `*${selectedText}*` +
                text.substring(selectionEnd);
              onTextChange(newText, selectionStart + 1);
            } else {
              const newText =
                text.substring(0, selectionStart) + '**' + text.substring(selectionStart);
              onTextChange(newText, selectionStart + 1);
            }
            break;

          case 'k': // Link
            e.preventDefault();
            if (selectedText) {
              const newText =
                text.substring(0, selectionStart) +
                `[${selectedText}](url)` +
                text.substring(selectionEnd);
              onTextChange(newText, selectionStart + selectedText.length + 3);
            } else {
              const newText =
                text.substring(0, selectionStart) + '[text](url)' + text.substring(selectionStart);
              onTextChange(newText, selectionStart + 6);
            }
            break;
        }
      }
    },
    [text, textareaRef, onTextChange]
  );

  // Handle list generation on Enter key
  const handleListGeneration = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!isMarkdownEnabled() || !textareaRef.current) return;

      const { selectionStart } = textareaRef.current;
      const lines = text.substring(0, selectionStart).split('\n');
      const currentLine = lines[lines.length - 1];

      const pattern = parseMarkdownList(currentLine);
      if (pattern) {
        if (isEmptyListItem(pattern)) {
          e.preventDefault();
          const result = removeEmptyListItem(text, selectionStart, selectionStart);
          onTextChange(result.newText, result.cursorPos);
        } else {
          e.preventDefault();
          const result = generateNextListItem(pattern);
          const newText =
            text.substring(0, selectionStart) + '\n' + result + text.substring(selectionStart);
          onTextChange(newText, selectionStart + 1 + result.length);
        }
      }
    },
    [text, textareaRef, onTextChange, isMarkdownEnabled]
  );

  // Handle empty list item removal
  const handleEmptyListItemRemoval = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!isMarkdownEnabled() || !textareaRef.current) return;

      const { selectionStart } = textareaRef.current;
      const lines = text.substring(0, selectionStart).split('\n');
      const currentLine = lines[lines.length - 1];

      const pattern = parseMarkdownList(currentLine);
      if (pattern && isEmptyListItem(pattern)) {
        e.preventDefault();
        const result = removeEmptyListItem(text, selectionStart, selectionStart);
        onTextChange(result.newText, result.cursorPos);
      }
    },
    [text, textareaRef, onTextChange, isMarkdownEnabled]
  );

  return {
    isMarkdownEnabled,
    handleMarkdownShortcut,
    handleListGeneration,
    handleEmptyListItemRemoval,
  };
}
