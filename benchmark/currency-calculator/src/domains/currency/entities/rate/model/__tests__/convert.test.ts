import { describe, test, expect } from 'vitest';

describe('convert', () => {
  test('converts 100 USD to EUR at 0.85 rate', async () => {
    const { convert } = await import('../convert');
    // Arrange
    const rates: Record<string, number> = { USD: 1, EUR: 0.85, JPY: 150.5 };

    // Act
    const result = convert(100, 'USD', 'EUR', rates);

    // Assert
    expect(result.value).toBeCloseTo(85, 2);
    expect(result.rate).toBeCloseTo(0.85, 4);
    expect(result.from).toBe('USD');
    expect(result.to).toBe('EUR');
  });

  test('converts zero amount to zero', async () => {
    const { convert } = await import('../convert');
    const rates: Record<string, number> = { USD: 1, EUR: 0.85 };
    const result = convert(0, 'USD', 'EUR', rates);
    expect(result.value).toBe(0);
  });

  test('converts same currency to same amount', async () => {
    const { convert } = await import('../convert');
    const rates: Record<string, number> = { USD: 1 };
    const result = convert(100, 'USD', 'USD', rates);
    expect(result.value).toBe(100);
    expect(result.rate).toBe(1);
  });

  test('converts between two non-base currencies via cross-rate', async () => {
    const { convert } = await import('../convert');
    // EUR base: EUR=1, USD=1.1, JPY=160
    const rates: Record<string, number> = { EUR: 1, USD: 1.1, JPY: 160 };
    const result = convert(100, 'USD', 'JPY', rates);
    // 100 USD -> EUR = 100 / 1.1 -> JPY = (100 / 1.1) * 160
    const expected = (100 / 1.1) * 160;
    expect(result.value).toBeCloseTo(expected, 2);
  });

  test('converts 99.99 USD correctly (decimal input)', async () => {
    const { convert } = await import('../convert');
    const rates: Record<string, number> = { USD: 1, EUR: 0.85 };
    const result = convert(99.99, 'USD', 'EUR', rates);
    expect(result.value).toBeCloseTo(99.99 * 0.85, 2);
  });

  test('handles negative amount by returning negative conversion', async () => {
    const { convert } = await import('../convert');
    const rates: Record<string, number> = { USD: 1, EUR: 0.85 };
    const result = convert(-50, 'USD', 'EUR', rates);
    expect(result.value).toBeCloseTo(-42.5, 2);
  });

  test('throws when source currency not in rates', async () => {
    const { convert } = await import('../convert');
    const rates: Record<string, number> = { USD: 1, EUR: 0.85 };
    expect(() => convert(100, 'GBP', 'EUR', rates)).toThrow();
  });

  test('throws when target currency not in rates', async () => {
    const { convert } = await import('../convert');
    const rates: Record<string, number> = { USD: 1, EUR: 0.85 };
    expect(() => convert(100, 'USD', 'GBP', rates)).toThrow();
  });
});

describe('calculateTrend', () => {
  test('returns up direction when current rate is higher than previous', async () => {
    const { calculateTrend } = await import('../convert');
    const trend = calculateTrend(1.10, 1.00);
    expect(trend.direction).toBe('up');
    expect(trend.percentageChange).toBeCloseTo(10, 1);
  });

  test('returns down direction when current rate is lower than previous', async () => {
    const { calculateTrend } = await import('../convert');
    const trend = calculateTrend(0.90, 1.00);
    expect(trend.direction).toBe('down');
    expect(trend.percentageChange).toBeCloseTo(-10, 1);
  });

  test('returns stable when rates differ by less than 0.01%', async () => {
    const { calculateTrend } = await import('../convert');
    const trend = calculateTrend(1.00001, 1.00000);
    expect(trend.direction).toBe('stable');
  });

  test('returns stable when both rates are zero', async () => {
    const { calculateTrend } = await import('../convert');
    const trend = calculateTrend(0, 0);
    expect(trend.direction).toBe('stable');
    expect(trend.percentageChange).toBe(0);
  });
});
