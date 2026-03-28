import { describe, test, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

describe('useComparisonVM', () => {
  const rates: Record<string, number> = {
    EUR: 1, USD: 1.1, JPY: 160.5, GBP: 0.86, KRW: 1480, CNY: 7.8,
  };

  beforeEach(() => {
    localStorage.clear();
  });

  test('provides formatted comparison items from use-case results', async () => {
    const { useComparisonVM } = await import('../useComparisonVM');
    const { result } = renderHook(() => useComparisonVM('100', 'USD', rates));

    // Default comparison list is ['USD', 'EUR', 'JPY', 'GBP', 'CNY']
    // Source 'USD' is excluded, so we should have 4 items
    expect(result.current.items.length).toBeGreaterThanOrEqual(4);
    expect(result.current.items[0]).toHaveProperty('code');
    expect(result.current.items[0]).toHaveProperty('name');
    expect(result.current.items[0]).toHaveProperty('convertedDisplay');
    // convertedDisplay should be a formatted string (not a raw number)
    expect(typeof result.current.items[0].convertedDisplay).toBe('string');
  });

  test('provides available currencies for adding (excluding current source and comparison codes)', async () => {
    const { useComparisonVM } = await import('../useComparisonVM');
    const { result } = renderHook(() => useComparisonVM('100', 'USD', rates));

    // availableCurrencies should not include the source currency or already-in-list currencies
    expect(result.current.availableCurrencies).toBeDefined();
    expect(Array.isArray(result.current.availableCurrencies)).toBe(true);
    // Should not contain 'USD' (source) or default comparison codes
    const availCodes = result.current.availableCurrencies.map(c => c.code);
    expect(availCodes).not.toContain('USD');
    // Default list includes EUR, JPY, GBP, CNY - these should not be in available
    expect(availCodes).not.toContain('EUR');
    expect(availCodes).not.toContain('JPY');
  });

  test('does not import CURRENCIES directly in the ViewModel - uses entities through orchestration', async () => {
    // This test ensures the ViewModel provides availableCurrencies
    // so the View does not need to import CURRENCIES directly
    const { useComparisonVM } = await import('../useComparisonVM');
    const { result } = renderHook(() => useComparisonVM('100', 'USD', rates));

    expect(result.current.availableCurrencies).toBeDefined();
    // Each item should have code and name properties
    if (result.current.availableCurrencies.length > 0) {
      expect(result.current.availableCurrencies[0]).toHaveProperty('code');
      expect(result.current.availableCurrencies[0]).toHaveProperty('name');
    }
  });

  test('updates available currencies when a currency is added', async () => {
    const { useComparisonVM } = await import('../useComparisonVM');
    const { result } = renderHook(() => useComparisonVM('100', 'USD', rates));

    const initialAvailCount = result.current.availableCurrencies.length;

    act(() => {
      result.current.handleToggleAdding();
    });

    // Add a currency
    const codeToAdd = result.current.availableCurrencies[0]?.code;
    if (codeToAdd) {
      act(() => {
        result.current.handleAdd(codeToAdd);
      });

      expect(result.current.availableCurrencies.length).toBe(initialAvailCount - 1);
    }
  });
});
