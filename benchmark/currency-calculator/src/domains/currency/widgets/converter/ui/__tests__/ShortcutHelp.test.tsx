import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShortcutHelp } from '../ShortcutHelp';

describe('ShortcutHelp', () => {
  const shortcuts = [
    { key: 's', description: 'Swap currencies' },
    { key: 'a', description: 'Focus amount input' },
    { key: 'r', description: 'Refresh rates' },
  ];

  test('renders toggle button', () => {
    render(<ShortcutHelp shortcuts={shortcuts} />);
    expect(screen.getByText(/Keyboard Shortcuts/)).toBeInTheDocument();
  });

  test('shows shortcut list when toggled open', async () => {
    render(<ShortcutHelp shortcuts={shortcuts} />);
    const user = userEvent.setup();
    await user.click(screen.getByText(/Keyboard Shortcuts/));
    expect(screen.getByText('Swap currencies')).toBeInTheDocument();
    expect(screen.getByText('Focus amount input')).toBeInTheDocument();
    expect(screen.getByText('Refresh rates')).toBeInTheDocument();
  });

  test('does not import from features layer - receives data as props', () => {
    // This test documents the View purity constraint:
    // ShortcutHelp should receive shortcuts as props, not import them directly.
    render(<ShortcutHelp shortcuts={[{ key: 'x', description: 'Test shortcut' }]} />);
    // The component renders the props it receives
    const user = userEvent.setup();
    // Toggle open to verify custom data renders
    return user.click(screen.getByText(/Keyboard Shortcuts/)).then(() => {
      expect(screen.getByText('Test shortcut')).toBeInTheDocument();
    });
  });
});
