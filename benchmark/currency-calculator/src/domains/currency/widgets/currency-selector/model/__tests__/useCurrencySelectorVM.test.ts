import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

describe('useCurrencySelectorVM', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('provides selected currency display data from code', async () => {
    const { useCurrencySelectorVM } = await import('../useCurrencySelectorVM');
    const onCurrencyChange = () => {};
    const { result } = renderHook(() =>
      useCurrencySelectorVM('USD', onCurrencyChange),
    );
    expect(result.current.selectedCurrency).toBeDefined();
    expect(result.current.selectedCurrency?.code).toBe('USD');
    expect(result.current.selectedCurrency?.name).toBe('United States Dollar');
    expect(result.current.selectedCurrency?.flag).toBe('us');
  });

  test('returns undefined selectedCurrency for unknown code', async () => {
    const { useCurrencySelectorVM } = await import('../useCurrencySelectorVM');
    const { result } = renderHook(() =>
      useCurrencySelectorVM('XXX', () => {}),
    );
    expect(result.current.selectedCurrency).toBeUndefined();
  });

  test('filters currencies by search query', async () => {
    const { useCurrencySelectorVM } = await import('../useCurrencySelectorVM');
    const { result } = renderHook(() =>
      useCurrencySelectorVM('USD', () => {}),
    );

    act(() => {
      result.current.handleOpen();
    });

    act(() => {
      result.current.handleSearchChange('yen');
    });

    expect(result.current.filteredCurrencies.some(c => c.code === 'JPY')).toBe(true);
  });

  test('opens and closes dropdown', async () => {
    const { useCurrencySelectorVM } = await import('../useCurrencySelectorVM');
    const { result } = renderHook(() =>
      useCurrencySelectorVM('USD', () => {}),
    );

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.handleOpen();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.handleClose();
    });
    expect(result.current.isOpen).toBe(false);
  });

  test('provides dropdownRef and searchInputRef for View to bind', async () => {
    const { useCurrencySelectorVM } = await import('../useCurrencySelectorVM');
    const { result } = renderHook(() =>
      useCurrencySelectorVM('USD', () => {}),
    );

    expect(result.current.dropdownRef).toBeDefined();
    expect(result.current.searchInputRef).toBeDefined();
  });

  test('provides pre-formatted flag emoji via selectedFlagEmoji', async () => {
    const { useCurrencySelectorVM } = await import('../useCurrencySelectorVM');
    const { result } = renderHook(() =>
      useCurrencySelectorVM('USD', () => {}),
    );
    // US flag should be returned as emoji
    expect(result.current.selectedFlagEmoji).toBeTruthy();
    expect(typeof result.current.selectedFlagEmoji).toBe('string');
  });

  test('provides getFlagEmoji function for View to format flags', async () => {
    const { useCurrencySelectorVM } = await import('../useCurrencySelectorVM');
    const { result } = renderHook(() =>
      useCurrencySelectorVM('USD', () => {}),
    );
    // getFlagEmoji should be a function on the ViewModel
    expect(typeof result.current.getFlagEmoji).toBe('function');
    expect(result.current.getFlagEmoji('us')).toBeTruthy();
  });
});
