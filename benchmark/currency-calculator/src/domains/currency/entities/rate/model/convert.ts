// Types are now derived from Zod schemas (single source of truth).
// Re-export for backward compatibility.
export type { ConversionResult, TrendResult } from './schema';
import type { ConversionResult, TrendResult } from './schema';

/**
 * Convert an amount from one currency to another using a rates map.
 * The rates map values are all relative to the same base currency.
 * Cross-rate conversion: amount / sourceRate * targetRate.
 */
export function convert(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>,
): ConversionResult {
  if (!(from in rates)) {
    throw new Error(`Source currency "${from}" not found in rates`);
  }
  if (!(to in rates)) {
    throw new Error(`Target currency "${to}" not found in rates`);
  }

  const sourceRate = rates[from];
  const targetRate = rates[to];
  const crossRate = targetRate / sourceRate;
  const value = amount * crossRate;

  return { value, rate: crossRate, from, to };
}

/**
 * Calculate the trend between a current and previous rate.
 * Returns direction (up/down/stable) and percentage change.
 */
export function calculateTrend(
  currentRate: number,
  previousRate: number,
): TrendResult {
  if (previousRate === 0) {
    return { direction: 'stable', percentageChange: 0 };
  }

  const percentageChange =
    ((currentRate - previousRate) / previousRate) * 100;

  const STABLE_THRESHOLD = 0.01;
  let direction: 'up' | 'down' | 'stable';

  if (Math.abs(percentageChange) < STABLE_THRESHOLD) {
    direction = 'stable';
  } else if (percentageChange > 0) {
    direction = 'up';
  } else {
    direction = 'down';
  }

  return { direction, percentageChange };
}
