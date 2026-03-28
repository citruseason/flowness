// Re-export all entity types from Zod schemas (single source of truth).
// This file exists for backward compatibility -- all types are now derived via z.infer.
export type {
  Currency,
  ExchangeRate,
  Conversion,
  RateTrend,
  FavoritePair,
} from './schema';
