import { describe, test, expect, beforeEach } from 'vitest';

describe('Comparison List', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('returns default currencies when no saved list exists', async () => {
    const { getComparisonList } = await import('../comparison');
    const list = getComparisonList();
    expect(list).toEqual(['USD', 'EUR', 'JPY', 'GBP', 'CNY']);
  });

  test('adds a currency to comparison list', async () => {
    const { getComparisonList, addToComparison } = await import(
      '../comparison'
    );
    addToComparison('KRW');
    const list = getComparisonList();
    expect(list).toContain('KRW');
  });

  test('does not add duplicate currency', async () => {
    const { getComparisonList, addToComparison } = await import(
      '../comparison'
    );
    addToComparison('USD'); // Already in default
    const list = getComparisonList();
    expect(list.filter((c) => c === 'USD').length).toBe(1);
  });

  test('removes a currency from comparison list', async () => {
    const { getComparisonList, removeFromComparison } = await import(
      '../comparison'
    );
    removeFromComparison('CNY');
    const list = getComparisonList();
    expect(list).not.toContain('CNY');
    expect(list.length).toBe(4);
  });

  test('persists comparison list in localStorage', async () => {
    const { addToComparison } = await import('../comparison');
    addToComparison('AUD');
    const stored = localStorage.getItem('currency-calculator-comparison');
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)).toContain('AUD');
  });
});
