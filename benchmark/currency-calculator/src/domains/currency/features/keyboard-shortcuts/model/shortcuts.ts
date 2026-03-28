import { useEffect } from 'react';

export interface ShortcutHandlers {
  onSwap: () => void;
  onFocusAmount: () => void;
  onRefresh: () => void;
}

export const SHORTCUTS = [
  { key: 's', description: 'Swap currencies', action: 'onSwap' as const },
  { key: 'a', description: 'Focus amount input', action: 'onFocusAmount' as const },
  { key: 'r', description: 'Refresh rates', action: 'onRefresh' as const },
] as const;

/**
 * Registers global keyboard shortcuts (Alt + key).
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!event.altKey) return;

      const shortcut = SHORTCUTS.find((s) => s.key === event.key.toLowerCase());
      if (shortcut) {
        event.preventDefault();
        handlers[shortcut.action]();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
