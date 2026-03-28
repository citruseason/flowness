import { describe, test, expect } from 'vitest';

describe('Currency Entity', () => {
  describe('CURRENCIES constant', () => {
    test('contains at least 30 currencies', async () => {
      const { CURRENCIES } = await import('../currencies');
      expect(CURRENCIES.length).toBeGreaterThanOrEqual(30);
    });

    test('each currency has code, name, symbol, and flag', async () => {
      const { CURRENCIES } = await import('../currencies');
      for (const currency of CURRENCIES) {
        expect(currency).toHaveProperty('code');
        expect(currency).toHaveProperty('name');
        expect(currency).toHaveProperty('symbol');
        expect(currency).toHaveProperty('flag');
        expect(currency.code).toMatch(/^[A-Z]{3}$/);
        expect(currency.name.length).toBeGreaterThan(0);
      }
    });

    test('includes USD, EUR, JPY, GBP, KRW', async () => {
      const { CURRENCIES } = await import('../currencies');
      const codes = CURRENCIES.map((c) => c.code);
      expect(codes).toContain('USD');
      expect(codes).toContain('EUR');
      expect(codes).toContain('JPY');
      expect(codes).toContain('GBP');
      expect(codes).toContain('KRW');
    });

    test('has no duplicate currency codes', async () => {
      const { CURRENCIES } = await import('../currencies');
      const codes = CURRENCIES.map((c) => c.code);
      expect(new Set(codes).size).toBe(codes.length);
    });
  });

  describe('getCurrencyByCode', () => {
    test('returns the currency matching the given code', async () => {
      const { getCurrencyByCode } = await import('../currencies');
      const usd = getCurrencyByCode('USD');
      expect(usd).toBeDefined();
      expect(usd!.code).toBe('USD');
      expect(usd!.name).toBe('United States Dollar');
    });

    test('returns undefined for unknown code', async () => {
      const { getCurrencyByCode } = await import('../currencies');
      expect(getCurrencyByCode('XXX')).toBeUndefined();
    });
  });

  describe('Currency decimal places', () => {
    test('JPY has 0 decimal places', async () => {
      const { getDecimalPlaces } = await import('../currencies');
      expect(getDecimalPlaces('JPY')).toBe(0);
    });

    test('USD has 2 decimal places', async () => {
      const { getDecimalPlaces } = await import('../currencies');
      expect(getDecimalPlaces('USD')).toBe(2);
    });

    test('KWD has 3 decimal places', async () => {
      const { getDecimalPlaces } = await import('../currencies');
      expect(getDecimalPlaces('KWD')).toBe(3);
    });

    test('defaults to 2 decimal places for unknown currency', async () => {
      const { getDecimalPlaces } = await import('../currencies');
      expect(getDecimalPlaces('ZZZ')).toBe(2);
    });
  });
});
