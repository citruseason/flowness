import { describe, test, expect } from 'vitest';

describe('parseAmountInput', () => {
  test('parses valid numeric string', async () => {
    const { parseAmountInput } = await import('../format');
    expect(parseAmountInput('100')).toBe(100);
  });

  test('parses decimal string', async () => {
    const { parseAmountInput } = await import('../format');
    expect(parseAmountInput('99.99')).toBeCloseTo(99.99);
  });

  test('returns NaN for non-numeric input', async () => {
    const { parseAmountInput } = await import('../format');
    expect(parseAmountInput('abc')).toBeNaN();
  });

  test('returns 0 for empty string', async () => {
    const { parseAmountInput } = await import('../format');
    expect(parseAmountInput('')).toBe(0);
  });

  test('parses string with leading/trailing spaces', async () => {
    const { parseAmountInput } = await import('../format');
    expect(parseAmountInput('  42.5  ')).toBeCloseTo(42.5);
  });
});
