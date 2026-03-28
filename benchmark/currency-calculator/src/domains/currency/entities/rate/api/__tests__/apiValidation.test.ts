import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { ZodError } from 'zod';

describe('API Response Validation (lib-zod/api-response-validation)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('fetchLatestRates throws ZodError when API returns malformed response', async () => {
    const { fetchLatestRates } = await import('../rateApi');
    // API returns an object missing required "base" field
    const malformed = { date: '2026-03-29', rates: { USD: 1.1 } };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(malformed), { status: 200 }),
    );

    await expect(fetchLatestRates('EUR')).rejects.toThrow(ZodError);
  });

  test('fetchHistoricalRates throws ZodError when API returns non-object rates', async () => {
    const { fetchHistoricalRates } = await import('../rateApi');
    const malformed = { base: 'EUR', date: '2026-03-28', rates: 'not-an-object' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(malformed), { status: 200 }),
    );

    await expect(fetchHistoricalRates('EUR', '2026-03-28')).rejects.toThrow(ZodError);
  });

  test('RateCache.get() returns null when localStorage contains corrupt JSON', async () => {
    const { RateCache } = await import('../rateApi');
    localStorage.setItem('currency-calculator-rate-cache', '{corrupt json{{');
    const cache = new RateCache();
    expect(cache.get()).toBeNull();
  });

  test('RateCache.get() returns null when localStorage contains valid JSON but wrong shape', async () => {
    const { RateCache } = await import('../rateApi');
    // Missing required fields -- should fail Zod validation
    localStorage.setItem('currency-calculator-rate-cache', JSON.stringify({ foo: 'bar' }));
    const cache = new RateCache();
    expect(cache.get()).toBeNull();
  });

  test('RateCache.get() returns validated data when localStorage contains valid shape', async () => {
    const { RateCache } = await import('../rateApi');
    const validData = {
      base: 'EUR',
      date: '2026-03-29',
      rates: { USD: 1.1 },
      timestamp: Date.now(),
    };
    localStorage.setItem('currency-calculator-rate-cache', JSON.stringify(validData));
    const cache = new RateCache();
    const result = cache.get();
    expect(result).not.toBeNull();
    expect(result!.base).toBe('EUR');
  });
});
