import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

describe('useRateData (Presenter)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const mockRatesResponse = {
    base: 'EUR',
    date: '2026-03-29',
    rates: { USD: 1.1, EUR: 1, JPY: 160.5, GBP: 0.86, KRW: 1480 },
  };

  const mockHistoricalResponse = {
    base: 'EUR',
    date: '2026-03-28',
    rates: { USD: 1.08, EUR: 1, JPY: 159, GBP: 0.85, KRW: 1470 },
  };

  function setupFetchMock() {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockRatesResponse), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockHistoricalResponse), { status: 200 }),
      );
  }

  test('returns status "loading" initially while fetching', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise(() => {}),
    );
    const { useRateData } = await import('../useRateData');
    const { result } = renderHook(() => useRateData());

    expect(result.current.status).toBe('loading');
  });

  test('returns status "success" with rate data after fetch completes', async () => {
    setupFetchMock();
    const { useRateData } = await import('../useRateData');
    const { result } = renderHook(() => useRateData());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.status).toBe('success');
    expect(result.current.rateData).not.toBeNull();
    expect(result.current.rateData!.rates.USD).toBe(1.1);
  });

  test('fetches historical rate data alongside latest rates', async () => {
    setupFetchMock();
    const { useRateData } = await import('../useRateData');
    const { result } = renderHook(() => useRateData());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.historicalRateData).not.toBeNull();
    expect(result.current.historicalRateData!.rates.USD).toBe(1.08);
  });

  test('returns status "error" with raw fetchError when fetch fails and no cache available', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
      new Error('Network error'),
    );
    const { useRateData } = await import('../useRateData');
    const { result } = renderHook(() => useRateData());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.status).toBe('error');
    // Presenter returns raw Error, not a formatted string
    expect(result.current.fetchError).toBeInstanceOf(Error);
    expect(result.current.fetchError?.message).toBe('Network error');
  });

  test('falls back to cached rates when fetch fails', async () => {
    // Pre-populate cache
    const cachedData = {
      base: 'EUR',
      date: '2026-03-28',
      rates: { USD: 1.09, EUR: 1 },
      timestamp: Date.now(),
    };
    localStorage.setItem('currency-calculator-rate-cache', JSON.stringify(cachedData));

    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
      new Error('Network error'),
    );
    const { useRateData } = await import('../useRateData');
    const { result } = renderHook(() => useRateData());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.rateData).not.toBeNull();
    expect(result.current.rateData!.rates.USD).toBe(1.09);
  });

  test('provides a refresh function that re-fetches rates', async () => {
    setupFetchMock();
    const { useRateData } = await import('../useRateData');
    const { result } = renderHook(() => useRateData());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Setup new mocks for refresh
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...mockRatesResponse, rates: { ...mockRatesResponse.rates, USD: 1.2 } }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockHistoricalResponse), { status: 200 }),
      );

    act(() => {
      result.current.refresh();
    });

    // While refreshing, status should be loading
    expect(result.current.status).toBe('loading');

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.status).toBe('success');
    expect(result.current.rateData!.rates.USD).toBe(1.2);
  });

  test('does not expose isLoading, error, isStale, or errorMessage (those are ViewModel concerns)', async () => {
    setupFetchMock();
    const { useRateData } = await import('../useRateData');
    const { result } = renderHook(() => useRateData());

    // The presenter should NOT have these properties -- they are ViewModel concerns
    expect(result.current).not.toHaveProperty('isLoading');
    expect(result.current).not.toHaveProperty('error');
    expect(result.current).not.toHaveProperty('isStale');
    expect(result.current).not.toHaveProperty('errorMessage');
  });

  test('returns rateData timestamp for ViewModel to derive staleness', async () => {
    setupFetchMock();
    const { useRateData } = await import('../useRateData');
    const { result } = renderHook(() => useRateData());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Presenter provides raw timestamp in rateData -- ViewModel can derive isStale
    expect(result.current.rateData!.timestamp).toBeDefined();
    expect(typeof result.current.rateData!.timestamp).toBe('number');
  });
});
