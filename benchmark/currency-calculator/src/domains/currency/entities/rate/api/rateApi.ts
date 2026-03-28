import { frankfurterResponseSchema, rateDataSchema } from '../model/schema';
import type { RateData } from '../model/schema';

// Re-export the type for backward compatibility
export type { RateData } from '../model/schema';

const API_BASE = 'https://api.frankfurter.app';
const CACHE_KEY = 'currency-calculator-rate-cache';

export async function fetchLatestRates(base: string): Promise<RateData> {
  const response = await fetch(`${API_BASE}/latest?from=${base}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch rates: ${response.status}`);
  }
  const json = await response.json();
  const parsed = frankfurterResponseSchema.parse(json);
  return {
    base: parsed.base,
    date: parsed.date,
    rates: { [parsed.base]: 1, ...parsed.rates },
    timestamp: Date.now(),
  };
}

export async function fetchHistoricalRates(
  base: string,
  date: string,
): Promise<RateData> {
  const response = await fetch(`${API_BASE}/${date}?from=${base}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch historical rates: ${response.status}`);
  }
  const json = await response.json();
  const parsed = frankfurterResponseSchema.parse(json);
  return {
    base: parsed.base,
    date: parsed.date,
    rates: { [parsed.base]: 1, ...parsed.rates },
    timestamp: Date.now(),
  };
}

export class RateCache {
  private maxAge: number;

  constructor(maxAge: number = 5 * 60 * 1000) {
    this.maxAge = maxAge;
  }

  set(data: RateData): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
      // localStorage might be full or unavailable
    }
  }

  get(): RateData | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      return rateDataSchema.parse(JSON.parse(raw));
    } catch {
      // ZodError or JSON parse error -- treat as missing cache
      return null;
    }
  }

  isStale(): boolean {
    const data = this.get();
    if (!data) return true;
    return Date.now() - data.timestamp > this.maxAge;
  }

  clear(): void {
    localStorage.removeItem(CACHE_KEY);
  }
}
