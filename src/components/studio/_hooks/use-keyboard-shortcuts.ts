import { useEffect } from 'react';

interface UseKeyboardShortcutsOptions {
  onGenerate: () => void;
  enabled: boolean;
}

const useKeyboardShortcuts = ({
  onGenerate,
  enabled,
}: UseKeyboardShortcutsOptions): void => {
  /**
   * Binds Cmd/Ctrl+Enter as a global "generate selected panel" shortcut.
   * Reads onGenerate from a closure that's recreated each render — that's
   * fine because the listener is reattached on every change anyway.
   */
  useEffect(() => {
    if (!enabled) return;

    const handler = (event: KeyboardEvent): void => {
      if (event.key !== 'Enter') return;
      if (!(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      onGenerate();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, onGenerate]);
};

export { useKeyboardShortcuts };
