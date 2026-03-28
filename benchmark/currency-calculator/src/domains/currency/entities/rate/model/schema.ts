import { z } from 'zod';

export const conversionResultSchema = z.object({
  value: z.number(),
  rate: z.number(),
  from: z.string(),
  to: z.string(),
});

export type ConversionResult = z.infer<typeof conversionResultSchema>;

export const trendResultSchema = z.object({
  direction: z.enum(['up', 'down', 'stable']),
  percentageChange: z.number(),
});

export type TrendResult = z.infer<typeof trendResultSchema>;

/**
 * Schema for the raw Frankfurter API response (before we add timestamp).
 */
export const frankfurterResponseSchema = z.object({
  base: z.string(),
  date: z.string(),
  rates: z.record(z.string(), z.number()),
});

export type FrankfurterResponse = z.infer<typeof frankfurterResponseSchema>;

/**
 * Schema for rate data as stored in our application (with timestamp).
 */
export const rateDataSchema = z.object({
  base: z.string(),
  date: z.string(),
  rates: z.record(z.string(), z.number()),
  timestamp: z.number(),
});

export type RateData = z.infer<typeof rateDataSchema>;
