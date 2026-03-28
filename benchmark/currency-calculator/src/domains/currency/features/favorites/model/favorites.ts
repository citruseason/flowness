import type { FavoritePair } from '../../../entities/currency/model/types';

const STORAGE_KEY = 'currency-calculator-favorites';
const MAX_FAVORITES = 10;

function load(): FavoritePair[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FavoritePair[];
  } catch {
    return [];
  }
}

function save(favorites: FavoritePair[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // localStorage might be unavailable
  }
}

export function getFavorites(): FavoritePair[] {
  return load();
}

export function addFavorite(source: string, target: string): void {
  const favorites = load();
  const exists = favorites.some(
    (f) => f.source === source && f.target === target,
  );
  if (exists) return;
  if (favorites.length >= MAX_FAVORITES) return;

  favorites.push({
    source,
    target,
    order: favorites.length,
    createdAt: Date.now(),
  });
  save(favorites);
}

export function removeFavorite(source: string, target: string): void {
  const favorites = load().filter(
    (f) => !(f.source === source && f.target === target),
  );
  // Re-index order
  favorites.forEach((f, i) => {
    f.order = i;
  });
  save(favorites);
}

export function isFavorite(source: string, target: string): boolean {
  return load().some((f) => f.source === source && f.target === target);
}

export function reorderFavorites(fromIndex: number, toIndex: number): void {
  const favorites = load();
  if (fromIndex < 0 || fromIndex >= favorites.length) return;
  if (toIndex < 0 || toIndex >= favorites.length) return;

  const [moved] = favorites.splice(fromIndex, 1);
  favorites.splice(toIndex, 0, moved);
  favorites.forEach((f, i) => {
    f.order = i;
  });
  save(favorites);
}
