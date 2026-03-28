import { convert, calculateTrend } from '../entities/rate/model/convert';
import type { ConversionResult, TrendResult } from '../entities/rate/model/convert';

/**
 * Use-case layer: computes a single currency conversion.
 * Orchestrates entity-layer convert function with guard checks.
 * Returns null when inputs are invalid or conversion cannot be performed.
 */
export function computeConversion(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number> | null,
): ConversionResult | null {
  if (!rates || isNaN(amount) || amount === 0) return null;
  try {
    return convert(amount, from, to, rates);
  } catch {
    return null;
  }
}

/**
 * Use-case layer: computes the trend between current and historical rates
 * for a given currency pair.
 * Returns null when rates are unavailable or currencies not found.
 */
export function computeTrend(
  from: string,
  to: string,
  currentRates: Record<string, number> | null,
  historicalRates: Record<string, number> | null,
): TrendResult | null {
  if (!currentRates || !historicalRates) return null;
  try {
    const currentResult = convert(1, from, to, currentRates);
    const historicalResult = convert(1, from, to, historicalRates);
    return calculateTrend(currentResult.rate, historicalResult.rate);
  } catch {
    return null;
  }
}
