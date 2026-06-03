export const isEventTargetInputElement = (e: KeyboardEvent | ClipboardEvent) => {
  // Check for standard input elements
  if (
    (e.target instanceof HTMLInputElement && e.target.type !== 'range') ||
    e.target instanceof HTMLTextAreaElement ||
    e.target instanceof HTMLSelectElement
  ) {
    return true;
  }

  // Check for contentEditable elements
  if (e.target instanceof HTMLElement && e.target.isContentEditable) {
    return true;
  }

  // Check if there's a text selection on the page
  // If user has selected text, we should let native copy behavior work
  const selection = window.getSelection();
  if (selection && selection.toString().trim().length > 0) {
    return true;
  }

  return false;
};
