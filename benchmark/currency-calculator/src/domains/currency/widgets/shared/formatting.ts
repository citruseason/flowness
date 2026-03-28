import { getDecimalPlaces } from '../../entities/currency/model/currencies';

/**
 * ViewModel-layer formatting utilities.
 * These transform raw data into display-ready strings for Views.
 */

/**
 * Format an amount with locale-aware formatting and currency-appropriate decimal places.
 */
export function formatAmount(
  amount: number,
  currencyCode: string,
  locale?: string,
): string {
  const decimals = getDecimalPlaces(currencyCode);
  return new Intl.NumberFormat(locale ?? navigator.language, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Format a per-unit exchange rate display: "1 USD = 1,342.50 KRW"
 */
export function formatRate(
  from: string,
  to: string,
  rate: number,
  locale?: string,
): string {
  const decimals = getDecimalPlaces(to);
  const formattedRate = new Intl.NumberFormat(locale ?? navigator.language, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: Math.max(decimals, 2),
  }).format(rate);
  return `1 ${from} = ${formattedRate} ${to}`;
}

/**
 * Format trend percentage change for display (absolute value with 2 decimal places).
 */
export function formatTrendDisplay(percentageChange: number): string {
  return `${Math.abs(percentageChange).toFixed(2)}%`;
}

/**
 * Format a timestamp into a locale time string for display.
 */
export function formatLastUpdated(timestamp: number | null): string {
  if (timestamp === null) return '';
  return new Date(timestamp).toLocaleTimeString();
}
