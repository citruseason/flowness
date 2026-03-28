import { convert } from '../entities/rate/model/convert';
import { getCurrencyByCode } from '../entities/currency/model/currencies';

export interface ComparisonConversionResult {
  code: string;
  name: string;
  value: number;
  rate: number;
}

/**
 * Use-case layer: computes currency conversions for the comparison panel.
 * Orchestrates entity-layer convert function for multiple targets.
 */
export function computeComparisons(
  amount: number,
  sourceCurrency: string,
  targetCodes: string[],
  rates: Record<string, number> | null,
): ComparisonConversionResult[] {
  if (!rates || isNaN(amount) || amount === 0) return [];

  return targetCodes
    .filter((code) => code !== sourceCurrency && code in rates)
    .map((code) => {
      try {
        const result = convert(amount, sourceCurrency, code, rates);
        const currency = getCurrencyByCode(code);
        return {
          code,
          name: currency?.name ?? code,
          value: result.value,
          rate: result.rate,
        };
      } catch {
        return null;
      }
    })
    .filter((item): item is ComparisonConversionResult => item !== null);
}
