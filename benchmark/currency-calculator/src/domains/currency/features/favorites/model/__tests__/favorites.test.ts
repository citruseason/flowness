import { describe, test, expect, beforeEach } from 'vitest';

describe('Favorites', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('starts with empty favorites list', async () => {
    const { getFavorites } = await import('../favorites');
    expect(getFavorites()).toEqual([]);
  });

  test('adds a favorite pair', async () => {
    const { addFavorite, getFavorites } = await import('../favorites');
    addFavorite('USD', 'EUR');
    const favorites = getFavorites();
    expect(favorites.length).toBe(1);
    expect(favorites[0].source).toBe('USD');
    expect(favorites[0].target).toBe('EUR');
  });

  test('does not add duplicate pair', async () => {
    const { addFavorite, getFavorites } = await import('../favorites');
    addFavorite('USD', 'EUR');
    addFavorite('USD', 'EUR');
    expect(getFavorites().length).toBe(1);
  });

  test('removes a favorite pair', async () => {
    const { addFavorite, removeFavorite, getFavorites } = await import(
      '../favorites'
    );
    addFavorite('USD', 'EUR');
    addFavorite('USD', 'JPY');
    removeFavorite('USD', 'EUR');
    const favorites = getFavorites();
    expect(favorites.length).toBe(1);
    expect(favorites[0].target).toBe('JPY');
  });

  test('checks if a pair is favorite', async () => {
    const { addFavorite, isFavorite } = await import('../favorites');
    addFavorite('USD', 'EUR');
    expect(isFavorite('USD', 'EUR')).toBe(true);
    expect(isFavorite('EUR', 'USD')).toBe(false);
  });

  test('persists favorites across instances', async () => {
    const mod1 = await import('../favorites');
    mod1.addFavorite('USD', 'KRW');

    // Re-read from localStorage
    const stored = localStorage.getItem('currency-calculator-favorites');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.length).toBe(1);
  });

  test('limits favorites to max 10', async () => {
    const { addFavorite, getFavorites } = await import('../favorites');
    const currencies = [
      'EUR', 'JPY', 'GBP', 'KRW', 'CNY',
      'AUD', 'CAD', 'CHF', 'HKD', 'SGD', 'NZD',
    ];
    for (const c of currencies) {
      addFavorite('USD', c);
    }
    expect(getFavorites().length).toBe(10);
  });

  test('reorders favorites by moving a pair to a new position', async () => {
    const { addFavorite, reorderFavorites, getFavorites } = await import(
      '../favorites'
    );
    addFavorite('USD', 'EUR');
    addFavorite('USD', 'JPY');
    addFavorite('USD', 'GBP');
    reorderFavorites(2, 0); // Move GBP pair from index 2 to index 0
    const favorites = getFavorites();
    expect(favorites[0].target).toBe('GBP');
    expect(favorites[1].target).toBe('EUR');
  });
});
