import { describe, test, expect } from 'vitest';

describe('computeComparisons (Use-case)', () => {
  const rates: Record<string, number> = { EUR: 1, USD: 1.1, JPY: 160.5, GBP: 0.86, KRW: 1480, CNY: 7.8 };

  test('converts amount to multiple target currencies', async () => {
    const { computeComparisons } = await import('../useComparisonConversion');
    const results = computeComparisons(100, 'USD', ['EUR', 'JPY', 'GBP'], rates);
    expect(results).toHaveLength(3);
    expect(results[0].code).toBe('EUR');
    expect(results[0].value).toBeGreaterThan(0);
  });

  test('excludes source currency from results', async () => {
    const { computeComparisons } = await import('../useComparisonConversion');
    const results = computeComparisons(100, 'USD', ['USD', 'EUR', 'JPY'], rates);
    expect(results.find(r => r.code === 'USD')).toBeUndefined();
  });

  test('skips currencies not present in rates', async () => {
    const { computeComparisons } = await import('../useComparisonConversion');
    const results = computeComparisons(100, 'USD', ['EUR', 'XYZ'], rates);
    expect(results).toHaveLength(1);
    expect(results[0].code).toBe('EUR');
  });

  test('returns empty array when rates is null', async () => {
    const { computeComparisons } = await import('../useComparisonConversion');
    const results = computeComparisons(100, 'USD', ['EUR'], null);
    expect(results).toEqual([]);
  });

  test('returns empty array when amount is zero', async () => {
    const { computeComparisons } = await import('../useComparisonConversion');
    const results = computeComparisons(0, 'USD', ['EUR'], rates);
    expect(results).toEqual([]);
  });

  test('returns empty array when amount is NaN', async () => {
    const { computeComparisons } = await import('../useComparisonConversion');
    const results = computeComparisons(NaN, 'USD', ['EUR'], rates);
    expect(results).toEqual([]);
  });

  test('each result contains code, name, value, and rate', async () => {
    const { computeComparisons } = await import('../useComparisonConversion');
    const results = computeComparisons(100, 'USD', ['EUR'], rates);
    expect(results[0]).toHaveProperty('code');
    expect(results[0]).toHaveProperty('name');
    expect(results[0]).toHaveProperty('value');
    expect(results[0]).toHaveProperty('rate');
  });
});
