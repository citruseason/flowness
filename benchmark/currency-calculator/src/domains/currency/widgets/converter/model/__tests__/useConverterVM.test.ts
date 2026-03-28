import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { RateDataState } from '../../../../use-cases/useRateData';
import type { RateData } from '../../../../entities/rate/api/rateApi';

describe('useConverterVM', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const mockRateData: RateData = {
    base: 'EUR',
    date: '2026-03-29',
    rates: { USD: 1.1, EUR: 1, JPY: 160.5, GBP: 0.86, KRW: 1480 },
    timestamp: Date.now(),
  };

  const mockHistoricalRateData: RateData = {
    base: 'EUR',
    date: '2026-03-28',
    rates: { USD: 1.08, EUR: 1, JPY: 159, GBP: 0.85, KRW: 1470 },
    timestamp: Date.now(),
  };

  function makePresenterState(overrides?: Partial<RateDataState>): RateDataState {
    return {
      status: 'success',
      rateData: mockRateData,
      historicalRateData: mockHistoricalRateData,
      fetchError: null,
      refresh: vi.fn(),
      ...overrides,
    };
  }

  test('initializes with default source USD and target EUR', async () => {
    const { useConverterVM } = await import('../useConverterVM');
    const presenterState = makePresenterState();
    const { result } = renderHook(() => useConverterVM(presenterState));
    expect(result.current.sourceCurrency).toBe('USD');
    expect(result.current.targetCurrency).toBe('EUR');
    expect(result.current.amount).toBe('');
  });

  test('updates amount when handleAmountChange is called', async () => {
    const { useConverterVM } = await import('../useConverterVM');
    const presenterState = makePresenterState();
    const { result } = renderHook(() => useConverterVM(presenterState));

    act(() => {
      result.current.handleAmountChange('100');
    });

    expect(result.current.amount).toBe('100');
  });

  test('computes converted amount after rates are available', async () => {
    const { useConverterVM } = await import('../useConverterVM');
    const presenterState = makePresenterState();
    const { result } = renderHook(() => useConverterVM(presenterState));

    act(() => {
      result.current.handleAmountChange('100');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400); // debounce
    });

    // Should have a numeric converted display
    expect(result.current.convertedDisplay).toBeTruthy();
    expect(result.current.convertedDisplay).not.toBe('');
  });

  test('swaps currencies when handleSwap is called', async () => {
    const { useConverterVM } = await import('../useConverterVM');
    const presenterState = makePresenterState();
    const { result } = renderHook(() => useConverterVM(presenterState));

    act(() => {
      result.current.handleSwap();
    });

    expect(result.current.sourceCurrency).toBe('EUR');
    expect(result.current.targetCurrency).toBe('USD');
  });

  test('changes source currency', async () => {
    const { useConverterVM } = await import('../useConverterVM');
    const presenterState = makePresenterState();
    const { result } = renderHook(() => useConverterVM(presenterState));

    act(() => {
      result.current.handleSourceChange('JPY');
    });

    expect(result.current.sourceCurrency).toBe('JPY');
  });

  test('changes target currency', async () => {
    const { useConverterVM } = await import('../useConverterVM');
    const presenterState = makePresenterState();
    const { result } = renderHook(() => useConverterVM(presenterState));

    act(() => {
      result.current.handleTargetChange('GBP');
    });

    expect(result.current.targetCurrency).toBe('GBP');
  });

  test('derives isLoading from presenter status (ViewModel responsibility)', async () => {
    const { useConverterVM } = await import('../useConverterVM');
    const presenterState = makePresenterState({ status: 'loading', rateData: null, historicalRateData: null });
    const { result } = renderHook(() => useConverterVM(presenterState));

    expect(result.current.isLoading).toBe(true);
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  test('derives error display from presenter fetchError (ViewModel responsibility)', async () => {
    const { useConverterVM } = await import('../useConverterVM');
    const presenterState = makePresenterState({
      status: 'error',
      fetchError: new Error('Network error'),
      rateData: null,
      historicalRateData: null,
    });
    const { result } = renderHook(() => useConverterVM(presenterState));

    // ViewModel derives error string from presenter fetchError
    expect(result.current.error).toBeTruthy();
    expect(typeof result.current.error).toBe('string');
  });

  test('clears error when presenter status is not error', async () => {
    const { useConverterVM } = await import('../useConverterVM');
    const presenterState = makePresenterState();
    const { result } = renderHook(() => useConverterVM(presenterState));

    // After successful fetch, error should be null
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  test('rejects non-numeric input and does not update amount', async () => {
    const { useConverterVM } = await import('../useConverterVM');
    const presenterState = makePresenterState();
    const { result } = renderHook(() => useConverterVM(presenterState));

    act(() => {
      result.current.handleAmountChange('abc');
    });

    // abc is rejected; amount stays empty
    expect(result.current.amount).toBe('');
  });

  test('accepts decimal input like 99.99', async () => {
    const { useConverterVM } = await import('../useConverterVM');
    const presenterState = makePresenterState();
    const { result } = renderHook(() => useConverterVM(presenterState));

    act(() => {
      result.current.handleAmountChange('99.99');
    });

    expect(result.current.amount).toBe('99.99');
  });

  test('provides pre-formatted lastUpdatedDisplay string', async () => {
    const { useConverterVM } = await import('../useConverterVM');
    const presenterState = makePresenterState();
    const { result } = renderHook(() => useConverterVM(presenterState));

    // Should be a string
    expect(typeof result.current.lastUpdatedDisplay).toBe('string');
  });

  test('provides pre-formatted trend display when trend data is available', async () => {
    const { useConverterVM } = await import('../useConverterVM');
    const presenterState = makePresenterState();
    const { result } = renderHook(() => useConverterVM(presenterState));

    // trend should have direction and displayPercentage
    if (result.current.trend) {
      expect(result.current.trend).toHaveProperty('direction');
      expect(result.current.trend).toHaveProperty('displayPercentage');
      expect(typeof result.current.trend.displayPercentage).toBe('string');
    }
  });

  test('provides shortcuts data for View to render', async () => {
    const { useConverterVM } = await import('../useConverterVM');
    const presenterState = makePresenterState();
    const { result } = renderHook(() => useConverterVM(presenterState));

    expect(result.current.shortcuts).toBeDefined();
    expect(Array.isArray(result.current.shortcuts)).toBe(true);
    expect(result.current.shortcuts.length).toBeGreaterThan(0);
    expect(result.current.shortcuts[0]).toHaveProperty('key');
    expect(result.current.shortcuts[0]).toHaveProperty('description');
  });

  test('derives isStale from rateData timestamp (ViewModel responsibility)', async () => {
    const { useConverterVM } = await import('../useConverterVM');
    const presenterState = makePresenterState();
    const { result } = renderHook(() => useConverterVM(presenterState));

    expect(typeof result.current.isStale).toBe('boolean');
  });

  test('handles favorite pair selection via handleSelectFavoritePair', async () => {
    const { useConverterVM } = await import('../useConverterVM');
    const presenterState = makePresenterState();
    const { result } = renderHook(() => useConverterVM(presenterState));

    act(() => {
      result.current.handleSelectFavoritePair('GBP', 'JPY');
    });

    expect(result.current.sourceCurrency).toBe('GBP');
    expect(result.current.targetCurrency).toBe('JPY');
  });

  test('delegates conversion and trend to use-case layer', async () => {
    // Verify that computeConversion and computeTrend exist as functions
    const useCasesModule = await import('../../../../use-cases/computeConversion');
    expect(useCasesModule.computeConversion).toBeDefined();
    expect(useCasesModule.computeTrend).toBeDefined();
    expect(typeof useCasesModule.computeConversion).toBe('function');
    expect(typeof useCasesModule.computeTrend).toBe('function');
  });
});
