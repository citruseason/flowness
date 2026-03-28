import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Rate API', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('fetchLatestRates', () => {
    test('fetches rates from API and returns structured data', async () => {
      const { fetchLatestRates } = await import('../rateApi');
      const mockResponse = {
        base: 'EUR',
        date: '2026-03-29',
        rates: { USD: 1.1, JPY: 160.5, GBP: 0.86 },
      };
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const result = await fetchLatestRates('EUR');

      expect(result.base).toBe('EUR');
      expect(result.rates).toHaveProperty('USD');
      expect(result.rates.USD).toBe(1.1);
      expect(result.date).toBe('2026-03-29');
    });

    test('throws error when API returns non-OK status', async () => {
      const { fetchLatestRates } = await import('../rateApi');
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('Not Found', { status: 404 }),
      );

      await expect(fetchLatestRates('USD')).rejects.toThrow();
    });

    test('throws error when network fails', async () => {
      const { fetchLatestRates } = await import('../rateApi');
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
        new Error('Network error'),
      );

      await expect(fetchLatestRates('USD')).rejects.toThrow('Network error');
    });
  });

  describe('fetchHistoricalRates', () => {
    test('fetches rates for a specific date', async () => {
      const { fetchHistoricalRates } = await import('../rateApi');
      const mockResponse = {
        base: 'EUR',
        date: '2026-03-28',
        rates: { USD: 1.09, JPY: 159.0 },
      };
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const result = await fetchHistoricalRates('EUR', '2026-03-28');

      expect(result.base).toBe('EUR');
      expect(result.date).toBe('2026-03-28');
      expect(result.rates.USD).toBe(1.09);
    });
  });

  describe('RateCache', () => {
    test('caches rates in localStorage', async () => {
      const { RateCache } = await import('../rateApi');
      const cache = new RateCache();
      const rateData = {
        base: 'EUR',
        date: '2026-03-29',
        rates: { USD: 1.1 },
        timestamp: Date.now(),
      };

      cache.set(rateData);
      const cached = cache.get();

      expect(cached).toBeDefined();
      expect(cached!.rates.USD).toBe(1.1);
    });

    test('returns null when cache is empty', async () => {
      const { RateCache } = await import('../rateApi');
      const cache = new RateCache();
      expect(cache.get()).toBeNull();
    });

    test('isStale returns true when cache exceeds max age', async () => {
      const { RateCache } = await import('../rateApi');
      const cache = new RateCache(60_000); // 1 minute max age
      const rateData = {
        base: 'EUR',
        date: '2026-03-29',
        rates: { USD: 1.1 },
        timestamp: Date.now(),
      };

      cache.set(rateData);
      expect(cache.isStale()).toBe(false);

      vi.advanceTimersByTime(61_000);
      expect(cache.isStale()).toBe(true);
    });

    test('isStale returns true when no cache exists', async () => {
      const { RateCache } = await import('../rateApi');
      const cache = new RateCache();
      expect(cache.isStale()).toBe(true);
    });
  });
});
