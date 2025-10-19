import { useCallback } from 'react';
import { calculateExpression } from '@renderer/utils/calculateExpression';

export interface UseCalculationProps {
  text: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onTextChange: (newText: string, cursorPos?: number) => void;
}

export function useCalculation({ text, textareaRef, onTextChange }: UseCalculationProps) {
  // Handle calculation with = key
  const handleCalculation = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!textareaRef.current) return;

      const { selectionStart } = textareaRef.current;
      const lines = text.substring(0, selectionStart).split('\n');
      const currentLine = lines[lines.length - 1];

      // Only calculate if = is at the end of the line and line contains math operators
      if (e.key === '=' && selectionStart === text.length && /[+\-*/]/.test(currentLine)) {
        e.preventDefault();

        try {
          const result = calculateExpression(currentLine);
          if (result !== null) {
            const newText = text + ' = ' + result;
            onTextChange(newText, newText.length);
          }
        } catch (error) {
          // Invalid expression, don't calculate
          console.debug('Invalid expression:', currentLine);
        }
      }
    },
    [text, textareaRef, onTextChange]
  );

  return {
    handleCalculation,
  };
}
