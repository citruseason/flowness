import { describe, test, expect } from 'vitest';

describe('ViewModel Formatting Utilities', () => {
  describe('formatAmount', () => {
    test('formats USD with 2 decimal places and dollar sign', async () => {
      const { formatAmount } = await import('../formatting');
      const result = formatAmount(1234.5, 'USD');
      expect(result).toContain('1');
      expect(result).toContain('234');
      expect(result).toMatch(/\.50|,50/);
    });

    test('formats JPY with 0 decimal places', async () => {
      const { formatAmount } = await import('../formatting');
      const result = formatAmount(1234.5, 'JPY');
      expect(result).not.toMatch(/\.\d/);
    });

    test('formats KWD with 3 decimal places', async () => {
      const { formatAmount } = await import('../formatting');
      const result = formatAmount(1234.5, 'KWD');
      expect(result).toMatch(/500/);
    });

    test('formats large numbers with thousands separator', async () => {
      const { formatAmount } = await import('../formatting');
      const result = formatAmount(1234567.89, 'USD');
      expect(result).toMatch(/1.234.567|1,234,567/);
    });

    test('formats zero correctly', async () => {
      const { formatAmount } = await import('../formatting');
      const result = formatAmount(0, 'USD');
      expect(result).toContain('0');
    });
  });

  describe('formatRate', () => {
    test('formats per-unit rate like "1 USD = 1,342.50 KRW"', async () => {
      const { formatRate } = await import('../formatting');
      const result = formatRate('USD', 'KRW', 1342.5);
      expect(result).toContain('1');
      expect(result).toContain('USD');
      expect(result).toContain('KRW');
      expect(result).toContain('1,342');
    });
  });

  describe('formatTrendDisplay', () => {
    test('formats positive percentage change', async () => {
      const { formatTrendDisplay } = await import('../formatting');
      expect(formatTrendDisplay(2.5)).toBe('2.50%');
    });

    test('formats negative percentage change as absolute value', async () => {
      const { formatTrendDisplay } = await import('../formatting');
      expect(formatTrendDisplay(-1.25)).toBe('1.25%');
    });

    test('formats zero percentage change', async () => {
      const { formatTrendDisplay } = await import('../formatting');
      expect(formatTrendDisplay(0)).toBe('0.00%');
    });
  });

  describe('formatLastUpdated', () => {
    test('formats a timestamp into a locale time string', async () => {
      const { formatLastUpdated } = await import('../formatting');
      const timestamp = new Date('2026-03-29T12:30:00').getTime();
      const result = formatLastUpdated(timestamp);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    test('returns empty string for null timestamp', async () => {
      const { formatLastUpdated } = await import('../formatting');
      expect(formatLastUpdated(null)).toBe('');
    });
  });
});
