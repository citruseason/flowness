import { describe, test, expect } from 'vitest';
import { z } from 'zod';

describe('Currency entity schemas (schema-single-source-of-truth)', () => {
  test('currencySchema validates a valid Currency object', async () => {
    const { currencySchema } = await import('../schema');
    const valid = { code: 'USD', name: 'United States Dollar', symbol: '$', flag: 'us' };
    expect(() => currencySchema.parse(valid)).not.toThrow();
  });

  test('currencySchema rejects object with missing fields', async () => {
    const { currencySchema } = await import('../schema');
    const invalid = { code: 'USD' };
    expect(() => currencySchema.parse(invalid)).toThrow(z.ZodError);
  });

  test('Currency type is inferred from currencySchema (z.infer)', async () => {
    const { currencySchema } = await import('../schema');
    type CurrencyFromSchema = z.infer<typeof currencySchema>;
    // Type-level check: this would fail TypeScript compilation if wrong
    const currency: CurrencyFromSchema = { code: 'USD', name: 'US Dollar', symbol: '$', flag: 'us' };
    expect(currency.code).toBe('USD');
  });

  test('exchangeRateSchema validates a valid ExchangeRate object', async () => {
    const { exchangeRateSchema } = await import('../schema');
    const valid = { base: 'USD', target: 'EUR', rate: 0.85, timestamp: Date.now() };
    expect(() => exchangeRateSchema.parse(valid)).not.toThrow();
  });

  test('exchangeRateSchema rejects negative rate', async () => {
    const { exchangeRateSchema } = await import('../schema');
    const invalid = { base: 'USD', target: 'EUR', rate: -1, timestamp: Date.now() };
    expect(() => exchangeRateSchema.parse(invalid)).toThrow(z.ZodError);
  });

  test('conversionSchema validates a valid Conversion object', async () => {
    const { conversionSchema } = await import('../schema');
    const valid = {
      sourceCurrency: 'USD',
      targetCurrency: 'EUR',
      inputAmount: 100,
      convertedAmount: 85,
      rateApplied: 0.85,
      timestamp: Date.now(),
    };
    expect(() => conversionSchema.parse(valid)).not.toThrow();
  });

  test('rateTrendSchema validates a valid RateTrend object', async () => {
    const { rateTrendSchema } = await import('../schema');
    const valid = {
      pair: 'USD/EUR',
      currentRate: 0.85,
      previousRate: 0.84,
      percentageChange: 1.19,
      direction: 'up',
    };
    expect(() => rateTrendSchema.parse(valid)).not.toThrow();
  });

  test('rateTrendSchema rejects invalid direction value', async () => {
    const { rateTrendSchema } = await import('../schema');
    const invalid = {
      pair: 'USD/EUR',
      currentRate: 0.85,
      previousRate: 0.84,
      percentageChange: 1.19,
      direction: 'sideways',
    };
    expect(() => rateTrendSchema.parse(invalid)).toThrow(z.ZodError);
  });

  test('favoritePairSchema validates a valid FavoritePair object', async () => {
    const { favoritePairSchema } = await import('../schema');
    const valid = { source: 'USD', target: 'EUR', order: 0, createdAt: Date.now() };
    expect(() => favoritePairSchema.parse(valid)).not.toThrow();
  });
});
