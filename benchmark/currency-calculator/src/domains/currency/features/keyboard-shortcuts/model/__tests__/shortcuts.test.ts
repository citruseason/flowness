import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('calls onSwap when Alt+S is pressed', async () => {
    const { useKeyboardShortcuts } = await import('../shortcuts');
    const handleSwap = vi.fn();
    const handleFocus = vi.fn();
    const handleRefresh = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts({
        onSwap: handleSwap,
        onFocusAmount: handleFocus,
        onRefresh: handleRefresh,
      }),
    );

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 's', altKey: true }),
      );
    });

    expect(handleSwap).toHaveBeenCalledTimes(1);
  });

  test('calls onFocusAmount when Alt+A is pressed', async () => {
    const { useKeyboardShortcuts } = await import('../shortcuts');
    const handleSwap = vi.fn();
    const handleFocus = vi.fn();
    const handleRefresh = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts({
        onSwap: handleSwap,
        onFocusAmount: handleFocus,
        onRefresh: handleRefresh,
      }),
    );

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'a', altKey: true }),
      );
    });

    expect(handleFocus).toHaveBeenCalledTimes(1);
  });

  test('calls onRefresh when Alt+R is pressed', async () => {
    const { useKeyboardShortcuts } = await import('../shortcuts');
    const handleSwap = vi.fn();
    const handleFocus = vi.fn();
    const handleRefresh = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts({
        onSwap: handleSwap,
        onFocusAmount: handleFocus,
        onRefresh: handleRefresh,
      }),
    );

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'r', altKey: true }),
      );
    });

    expect(handleRefresh).toHaveBeenCalledTimes(1);
  });

  test('does not trigger shortcuts when a non-shortcut key is pressed', async () => {
    const { useKeyboardShortcuts } = await import('../shortcuts');
    const handleSwap = vi.fn();
    const handleFocus = vi.fn();
    const handleRefresh = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts({
        onSwap: handleSwap,
        onFocusAmount: handleFocus,
        onRefresh: handleRefresh,
      }),
    );

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'x', altKey: true }),
      );
    });

    expect(handleSwap).not.toHaveBeenCalled();
    expect(handleFocus).not.toHaveBeenCalled();
    expect(handleRefresh).not.toHaveBeenCalled();
  });
});
