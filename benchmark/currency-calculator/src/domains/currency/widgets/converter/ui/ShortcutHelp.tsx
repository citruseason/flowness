import { useState } from 'react';

interface ShortcutItem {
  key: string;
  description: string;
}

interface ShortcutHelpProps {
  shortcuts: ShortcutItem[];
}

export function ShortcutHelp({ shortcuts }: ShortcutHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => setIsOpen((prev) => !prev);

  return (
    <div className="shortcut-help">
      <button
        className="shortcut-help-toggle"
        onClick={handleToggle}
        type="button"
        aria-expanded={isOpen}
      >
        Keyboard Shortcuts {isOpen ? '\u25B2' : '\u25BC'}
      </button>
      {isOpen && (
        <ul className="shortcut-list">
          {shortcuts.map((shortcut) => (
            <li key={shortcut.key} className="shortcut-item">
              <kbd>Alt + {shortcut.key.toUpperCase()}</kbd>
              <span>{shortcut.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
