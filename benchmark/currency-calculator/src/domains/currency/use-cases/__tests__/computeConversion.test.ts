import { describe, test, expect } from 'vitest';

describe('computeConversion (Use-case)', () => {
  const rates: Record<string, number> = {
    EUR: 1,
    USD: 1.1,
    JPY: 160.5,
    GBP: 0.86,
    KRW: 1480,
  };

  test('converts amount from source to target currency and returns raw result', async () => {
    const { computeConversion } = await import('../computeConversion');
    const result = computeConversion(100, 'USD', 'EUR', rates);
    expect(result).not.toBeNull();
    expect(result!.value).toBeGreaterThan(0);
    expect(result!.rate).toBeGreaterThan(0);
    expect(result!.from).toBe('USD');
    expect(result!.to).toBe('EUR');
  });

  test('returns null when rates is null', async () => {
    const { computeConversion } = await import('../computeConversion');
    const result = computeConversion(100, 'USD', 'EUR', null);
    expect(result).toBeNull();
  });

  test('returns null when amount is empty string (parsed as 0)', async () => {
    const { computeConversion } = await import('../computeConversion');
    const result = computeConversion(0, 'USD', 'EUR', rates);
    expect(result).toBeNull();
  });

  test('returns null when amount is NaN', async () => {
    const { computeConversion } = await import('../computeConversion');
    const result = computeConversion(NaN, 'USD', 'EUR', rates);
    expect(result).toBeNull();
  });

  test('returns null when source currency is not in rates', async () => {
    const { computeConversion } = await import('../computeConversion');
    const result = computeConversion(100, 'XYZ', 'EUR', rates);
    expect(result).toBeNull();
  });

  test('returns null when target currency is not in rates', async () => {
    const { computeConversion } = await import('../computeConversion');
    const result = computeConversion(100, 'USD', 'XYZ', rates);
    expect(result).toBeNull();
  });

  test('correctly computes cross-rate conversion (USD to KRW)', async () => {
    const { computeConversion } = await import('../computeConversion');
    const result = computeConversion(100, 'USD', 'KRW', rates);
    expect(result).not.toBeNull();
    // 100 * (1480 / 1.1) = ~134545.45
    const expectedRate = 1480 / 1.1;
    expect(result!.rate).toBeCloseTo(expectedRate, 2);
    expect(result!.value).toBeCloseTo(100 * expectedRate, 2);
  });
});

describe('computeTrend (Use-case)', () => {
  const currentRates: Record<string, number> = {
    EUR: 1,
    USD: 1.1,
    JPY: 160.5,
    GBP: 0.86,
  };

  const historicalRates: Record<string, number> = {
    EUR: 1,
    USD: 1.08,
    JPY: 159,
    GBP: 0.85,
  };

  test('computes trend between current and historical rates for a currency pair', async () => {
    const { computeTrend } = await import('../computeConversion');
    const result = computeTrend('USD', 'EUR', currentRates, historicalRates);
    expect(result).not.toBeNull();
    expect(result!.direction).toBeDefined();
    expect(typeof result!.percentageChange).toBe('number');
  });

  test('returns null when current rates is null', async () => {
    const { computeTrend } = await import('../computeConversion');
    const result = computeTrend('USD', 'EUR', null, historicalRates);
    expect(result).toBeNull();
  });

  test('returns null when historical rates is null', async () => {
    const { computeTrend } = await import('../computeConversion');
    const result = computeTrend('USD', 'EUR', currentRates, null);
    expect(result).toBeNull();
  });

  test('returns null when source currency not in rates', async () => {
    const { computeTrend } = await import('../computeConversion');
    const result = computeTrend('XYZ', 'EUR', currentRates, historicalRates);
    expect(result).toBeNull();
  });

  test('returns null when target currency not in rates', async () => {
    const { computeTrend } = await import('../computeConversion');
    const result = computeTrend('USD', 'XYZ', currentRates, historicalRates);
    expect(result).toBeNull();
  });

  test('detects upward trend when current rate is higher', async () => {
    const { computeTrend } = await import('../computeConversion');
    // USD/JPY: current = 160.5/1.1 = ~145.9, historical = 159/1.08 = ~147.2
    // So JPY rate went down relative to USD, which is 'down'
    // For EUR: current = 1/1.1 = ~0.909, historical = 1/1.08 = ~0.926 => down
    // Let's pick a pair that goes up: USD/GBP
    // current = 0.86/1.1 = 0.7818, historical = 0.85/1.08 = 0.7870 => down
    // Actually, let's test with known direction via custom rates
    const highCurrent = { EUR: 1, USD: 1.0, GBP: 2.0 };
    const lowHistorical = { EUR: 1, USD: 1.0, GBP: 1.5 };
    const result = computeTrend('USD', 'GBP', highCurrent, lowHistorical);
    expect(result).not.toBeNull();
    expect(result!.direction).toBe('up');
    expect(result!.percentageChange).toBeGreaterThan(0);
  });

  test('detects downward trend when current rate is lower', async () => {
    const { computeTrend } = await import('../computeConversion');
    const lowCurrent = { EUR: 1, USD: 1.0, GBP: 1.5 };
    const highHistorical = { EUR: 1, USD: 1.0, GBP: 2.0 };
    const result = computeTrend('USD', 'GBP', lowCurrent, highHistorical);
    expect(result).not.toBeNull();
    expect(result!.direction).toBe('down');
    expect(result!.percentageChange).toBeLessThan(0);
  });

  test('detects stable trend when rates are the same', async () => {
    const { computeTrend } = await import('../computeConversion');
    const sameRates = { EUR: 1, USD: 1.1, GBP: 0.86 };
    const result = computeTrend('USD', 'GBP', sameRates, sameRates);
    expect(result).not.toBeNull();
    expect(result!.direction).toBe('stable');
  });
});
