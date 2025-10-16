/**
 * Utility functions for textarea manipulation that preserve undo/redo history
 */

/**
 * Replaces text in a textarea while preserving the browser's undo/redo stack
 * @param textarea - The textarea element
 * @param start - Start position of the text to replace
 * @param end - End position of the text to replace
 * @param replacement - Text to insert
 * @returns true if successful, false otherwise
 */
export function replaceTextWithUndo(
  textarea: HTMLTextAreaElement,
  start: number,
  end: number,
  replacement: string
): boolean {
  if (!textarea) return false;

  // Focus the textarea
  textarea.focus();

  // Set selection to the range to be replaced
  textarea.setSelectionRange(start, end);

  // Use execCommand to replace text (preserves undo stack)
  // Although deprecated, it's still the most reliable way to preserve undo history
  const success = document.execCommand('insertText', false, replacement);

  if (!success) {
    // Fallback: manually update value (won't preserve undo)
    const value = textarea.value;
    textarea.value = value.substring(0, start) + replacement + value.substring(end);

    // Trigger input event to notify React
    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);
  }

  return success;
}

/**
 * Inserts text at the current cursor position while preserving undo/redo stack
 * @param textarea - The textarea element
 * @param text - Text to insert
 * @returns true if successful, false otherwise
 */
export function insertTextWithUndo(
  textarea: HTMLTextAreaElement,
  text: string
): boolean {
  if (!textarea) return false;

  textarea.focus();

  const success = document.execCommand('insertText', false, text);

  if (!success) {
    // Fallback
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;

    textarea.value = value.substring(0, start) + text + value.substring(end);
    textarea.setSelectionRange(start + text.length, start + text.length);

    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);
  }

  return success;
}

/**
 * Sets the entire textarea value while preserving undo/redo stack
 * This selects all text and replaces it
 * @param textarea - The textarea element
 * @param newValue - New value for the textarea
 * @returns true if successful, false otherwise
 */
export function setTextareaValueWithUndo(
  textarea: HTMLTextAreaElement,
  newValue: string
): boolean {
  if (!textarea) return false;

  textarea.focus();

  // Select all text
  textarea.setSelectionRange(0, textarea.value.length);

  // Replace with new value
  const success = document.execCommand('insertText', false, newValue);

  if (!success) {
    // Fallback
    textarea.value = newValue;
    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);
  }

  return success;
}
