import { useEffect } from 'react';

interface UseKeyboardShortcutsOptions {
  onGenerate: () => void;
  generateEnabled: boolean;
  onUndo: () => void;
  undoEnabled: boolean;
  onSelectionDelete: () => void;
  selectionDeleteEnabled: boolean;
  onSelectionCopy: () => void;
  selectionCopyEnabled: boolean;
  onClipboardPaste: () => void;
  clipboardPasteEnabled: boolean;
}

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  return Boolean(target.closest('input, textarea, select'));
};

const useKeyboardShortcuts = ({
  onGenerate,
  generateEnabled,
  onUndo,
  undoEnabled,
  onSelectionDelete,
  selectionDeleteEnabled,
  onSelectionCopy,
  selectionCopyEnabled,
  onClipboardPaste,
  clipboardPasteEnabled,
}: UseKeyboardShortcutsOptions): void => {
  /**
   * Binds global editor shortcuts for generating, undoing, deleting, copying,
   * and pasting the current canvas selection while preserving native text-field
   * editing.
   */
  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if (
        event.key === 'Backspace' &&
        selectionDeleteEnabled &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.isComposing &&
        !isEditableTarget(event.target)
      ) {
        event.preventDefault();
        onSelectionDelete();
        return;
      }

      if (!(event.metaKey || event.ctrlKey)) return;

      const key = event.key.toLowerCase();
      const editableTarget = isEditableTarget(event.target);
      if (
        key === 'c' &&
        selectionCopyEnabled &&
        !event.shiftKey &&
        !event.altKey &&
        !editableTarget
      ) {
        event.preventDefault();
        onSelectionCopy();
        return;
      }

      if (
        key === 'v' &&
        clipboardPasteEnabled &&
        !event.shiftKey &&
        !event.altKey &&
        !editableTarget
      ) {
        event.preventDefault();
        onClipboardPaste();
        return;
      }

      if (key === 'z' && !event.shiftKey && undoEnabled) {
        event.preventDefault();
        onUndo();
        return;
      }

      if (event.key !== 'Enter') return;
      if (!generateEnabled) return;

      event.preventDefault();
      onGenerate();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    generateEnabled,
    clipboardPasteEnabled,
    onGenerate,
    onClipboardPaste,
    onSelectionDelete,
    onSelectionCopy,
    onUndo,
    selectionCopyEnabled,
    selectionDeleteEnabled,
    undoEnabled,
  ]);
};

export { useKeyboardShortcuts };
