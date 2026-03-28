import { z } from 'zod';

export const currencySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  symbol: z.string().min(1),
  flag: z.string().min(1),
});

export type Currency = z.infer<typeof currencySchema>;

export const exchangeRateSchema = z.object({
  base: z.string(),
  target: z.string(),
  rate: z.number().positive(),
  timestamp: z.number(),
});

export type ExchangeRate = z.infer<typeof exchangeRateSchema>;

export const conversionSchema = z.object({
  sourceCurrency: z.string(),
  targetCurrency: z.string(),
  inputAmount: z.number(),
  convertedAmount: z.number(),
  rateApplied: z.number(),
  timestamp: z.number(),
});

export type Conversion = z.infer<typeof conversionSchema>;

export const rateTrendSchema = z.object({
  pair: z.string(),
  currentRate: z.number(),
  previousRate: z.number(),
  percentageChange: z.number(),
  direction: z.enum(['up', 'down', 'stable']),
});

export type RateTrend = z.infer<typeof rateTrendSchema>;

export const favoritePairSchema = z.object({
  source: z.string(),
  target: z.string(),
  order: z.number(),
  createdAt: z.number(),
});

export type FavoritePair = z.infer<typeof favoritePairSchema>;
