import { CURRENCIES } from '../../../entities/currency/model/currencies';
import type { Currency } from '../../../entities/currency/model/types';

/**
 * Search/filter currencies by code or name.
 * Returns all currencies when query is empty.
 * Exact code matches are prioritized.
 */
export function searchCurrencies(query: string): Currency[] {
  if (!query.trim()) return [...CURRENCIES];

  const q = query.trim().toLowerCase();

  const matches = CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q),
  );

  // Sort: exact code match first, then alphabetical
  return matches.sort((a, b) => {
    const aExact = a.code.toLowerCase() === q;
    const bExact = b.code.toLowerCase() === q;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return a.code.localeCompare(b.code);
  });
}
