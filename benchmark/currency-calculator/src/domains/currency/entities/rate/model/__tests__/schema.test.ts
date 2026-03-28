import { describe, test, expect } from 'vitest';
import { z } from 'zod';

describe('Rate entity schemas (schema-single-source-of-truth)', () => {
  test('conversionResultSchema validates a valid ConversionResult', async () => {
    const { conversionResultSchema } = await import('../schema');
    const valid = { value: 85, rate: 0.85, from: 'USD', to: 'EUR' };
    expect(() => conversionResultSchema.parse(valid)).not.toThrow();
  });

  test('ConversionResult type is inferred from conversionResultSchema', async () => {
    const { conversionResultSchema } = await import('../schema');
    type CR = z.infer<typeof conversionResultSchema>;
    const result: CR = { value: 85, rate: 0.85, from: 'USD', to: 'EUR' };
    expect(result.value).toBe(85);
  });

  test('trendResultSchema validates a valid TrendResult', async () => {
    const { trendResultSchema } = await import('../schema');
    const valid = { direction: 'up', percentageChange: 1.5 };
    expect(() => trendResultSchema.parse(valid)).not.toThrow();
  });

  test('trendResultSchema rejects invalid direction', async () => {
    const { trendResultSchema } = await import('../schema');
    const invalid = { direction: 'sideways', percentageChange: 1.5 };
    expect(() => trendResultSchema.parse(invalid)).toThrow(z.ZodError);
  });

  test('rateDataSchema validates a valid RateData object', async () => {
    const { rateDataSchema } = await import('../schema');
    const valid = {
      base: 'EUR',
      date: '2026-03-29',
      rates: { USD: 1.1, JPY: 160.5 },
      timestamp: Date.now(),
    };
    expect(() => rateDataSchema.parse(valid)).not.toThrow();
  });

  test('rateDataSchema rejects object with missing base', async () => {
    const { rateDataSchema } = await import('../schema');
    const invalid = { date: '2026-03-29', rates: { USD: 1.1 }, timestamp: 123 };
    expect(() => rateDataSchema.parse(invalid)).toThrow(z.ZodError);
  });

  test('frankfurterResponseSchema validates API response shape (no timestamp)', async () => {
    const { frankfurterResponseSchema } = await import('../schema');
    const valid = {
      base: 'EUR',
      date: '2026-03-29',
      rates: { USD: 1.1, JPY: 160.5 },
    };
    expect(() => frankfurterResponseSchema.parse(valid)).not.toThrow();
  });

  test('frankfurterResponseSchema rejects response with extra unexpected shape', async () => {
    const { frankfurterResponseSchema } = await import('../schema');
    const missingBase = { date: '2026-03-29', rates: { USD: 1.1 } };
    expect(() => frankfurterResponseSchema.parse(missingBase)).toThrow(z.ZodError);
  });
});
