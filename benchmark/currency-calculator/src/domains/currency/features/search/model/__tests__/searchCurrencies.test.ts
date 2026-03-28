import { describe, test, expect } from 'vitest';

describe('searchCurrencies', () => {
  test('returns all currencies when query is empty', async () => {
    const { searchCurrencies } = await import('../searchCurrencies');
    const { CURRENCIES } = await import(
      '../../../../entities/currency/model/currencies'
    );
    const result = searchCurrencies('');
    expect(result.length).toBe(CURRENCIES.length);
  });

  test('filters by currency code (case-insensitive)', async () => {
    const { searchCurrencies } = await import('../searchCurrencies');
    const result = searchCurrencies('usd');
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].code).toBe('USD');
  });

  test('filters by currency name containing "yen"', async () => {
    const { searchCurrencies } = await import('../searchCurrencies');
    const result = searchCurrencies('yen');
    expect(result.some((c) => c.code === 'JPY')).toBe(true);
  });

  test('filters by partial name "euro"', async () => {
    const { searchCurrencies } = await import('../searchCurrencies');
    const result = searchCurrencies('euro');
    expect(result.some((c) => c.code === 'EUR')).toBe(true);
  });

  test('returns empty array when no currencies match', async () => {
    const { searchCurrencies } = await import('../searchCurrencies');
    const result = searchCurrencies('xyznotacurrency');
    expect(result.length).toBe(0);
  });

  test('puts exact code matches first', async () => {
    const { searchCurrencies } = await import('../searchCurrencies');
    const result = searchCurrencies('EUR');
    expect(result[0].code).toBe('EUR');
  });
});
