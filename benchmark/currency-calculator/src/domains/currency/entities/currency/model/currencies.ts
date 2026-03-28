import type { Currency } from './types';

export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'United States Dollar', symbol: '$', flag: 'us' },
  { code: 'EUR', name: 'Euro', symbol: '\u20AC', flag: 'eu' },
  { code: 'GBP', name: 'British Pound Sterling', symbol: '\u00A3', flag: 'gb' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '\u00A5', flag: 'jp' },
  { code: 'KRW', name: 'South Korean Won', symbol: '\u20A9', flag: 'kr' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '\u00A5', flag: 'cn' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: 'au' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: 'ca' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: 'ch' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: 'hk' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: 'sg' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: 'se' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: 'no' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: 'dk' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: 'nz' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: 'mx' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: 'br' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: 'za' },
  { code: 'INR', name: 'Indian Rupee', symbol: '\u20B9', flag: 'in' },
  { code: 'THB', name: 'Thai Baht', symbol: '\u0E3F', flag: 'th' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: 'my' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '\u20B1', flag: 'ph' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: 'id' },
  { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$', flag: 'tw' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'z\u0142', flag: 'pl' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '\u20BA', flag: 'tr' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '\u20BD', flag: 'ru' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'K\u010D', flag: 'cz' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', flag: 'hu' },
  { code: 'ILS', name: 'Israeli New Shekel', symbol: '\u20AA', flag: 'il' },
  { code: 'AED', name: 'United Arab Emirates Dirham', symbol: 'AED', flag: 'ae' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', flag: 'sa' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KWD', flag: 'kw' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E\u00A3', flag: 'eg' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', flag: 'cl' },
];

const DECIMAL_PLACES: Record<string, number> = {
  JPY: 0,
  KRW: 0,
  HUF: 0,
  CLP: 0,
  IDR: 0,
  KWD: 3,
  BHD: 3,
  OMR: 3,
};

export function getCurrencyByCode(code: string): Currency | undefined {
  return CURRENCIES.find((c) => c.code === code);
}

export function getDecimalPlaces(code: string): number {
  return DECIMAL_PLACES[code] ?? 2;
}
