---
title: React Query Integration
impact: HIGH
impactDescription: Disconnected Zustand and React Query state causes stale query results that do not reflect user selections
tags: zustand, react-query, query-key, integration, use-cases
---

## React Query Integration

**Impact: HIGH (Disconnected Zustand and React Query state causes stale query results that do not reflect user selections)**

When Zustand state affects which server data should be displayed, that state must flow into React Query's `queryKey`. This ensures that changing a filter in Zustand automatically triggers a new query with the updated parameters. The integration point is a use-case hook that reads Zustand state and passes it into the entity's `queryOptions` factory.

Without this connection, the UI shows the user's updated filter selections but the data grid still displays results from the previous query.

**Incorrect (Zustand state not reflected in queryKey -- filter change does not trigger refetch):**

```typescript
// domains/currency/use-cases/use-filtered-rates.ts
import { useSuspenseQuery } from "@tanstack/react-query";
import { rateQueries } from "../entities/rate/api/queries";
import { useCurrencyFilterStore } from "./use-currency-filter-store";

export function useFilteredRates() {
  const { baseCurrency } = useCurrencyFilterStore();
  // BAD: queryKey does not include baseCurrency -- always fetches the same data
  const { data: rates } = useSuspenseQuery(rateQueries.all("USD"));

  // Client-side filter gives illusion of working, but data is stale
  return rates;
}
```

**Correct (Zustand state flows into queryKey via queryOptions factory):**

```typescript
// domains/currency/use-cases/use-filtered-rates.ts
import { useSuspenseQuery } from "@tanstack/react-query";
import { rateQueries } from "../entities/rate/api/queries";
import { useCurrencyFilterStore } from "./use-currency-filter-store";

export function useFilteredRates() {
  const { baseCurrency } = useCurrencyFilterStore();

  // GOOD: baseCurrency from Zustand flows into queryKey via the factory
  // changing baseCurrency in the store automatically triggers a new query
  const { data: rates } = useSuspenseQuery(rateQueries.all(baseCurrency));

  return {
    rates,
    baseCurrency,
  };
}
```
