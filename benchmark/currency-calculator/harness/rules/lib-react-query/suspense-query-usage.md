---
title: Suspense Query Usage
impact: HIGH
impactDescription: Eliminates redundant loading state logic and guarantees data is always defined
tags: react-query, suspense, use-suspense-query, loading, error-boundary
---

## Suspense Query Usage

**Impact: HIGH (Eliminates redundant loading state logic and guarantees data is always defined)**

All read queries must use `useSuspenseQuery` or `useSuspenseQueries` instead of the base `useQuery`. In Suspense mode, React suspends the component until data is available, so `data` is always defined -- there is no `undefined` case. Loading states are handled by a `<Suspense>` fallback in the parent tree, and errors are caught by an `<ErrorBoundary>`. This removes the need for `isLoading` / `isError` branching inside the component.

When multiple queries are needed in parallel, use `useSuspenseQueries` to avoid sequential waterfalls. For dependent queries where the second query needs data from the first, chain `useSuspenseQuery` calls sequentially -- the Suspense guarantee ensures each call returns defined data.

**Incorrect (checking isLoading with useSuspenseQuery -- dead code):**

```typescript
// domains/currency/use-cases/use-converter-data.ts
import { useSuspenseQuery } from "@tanstack/react-query";
import { rateQueries } from "../entities/rate/api/queries";

export function useConverterData(base: string) {
  const { data, isLoading } = useSuspenseQuery(rateQueries.all(base));

  // BAD: isLoading is always false with useSuspenseQuery
  // This branch never executes -- it is dead code
  if (isLoading) return { rates: [], loading: true };

  return { rates: data.rates, loading: false };
}
```

**Correct (trusting Suspense guarantees -- data is always defined):**

```typescript
// domains/currency/use-cases/use-converter-data.ts
import { useSuspenseQueries } from "@tanstack/react-query";
import { rateQueries } from "../entities/rate/api/queries";
import { currencyQueries } from "../entities/currency/api/queries";

export function useConverterData(base: string) {
  const [ratesResult, currenciesResult] = useSuspenseQueries({
    queries: [
      rateQueries.all(base),
      currencyQueries.list(),
    ],
  });

  // data is always defined -- Suspense guarantees it
  return {
    rates: ratesResult.data,
    currencies: currenciesResult.data,
  };
}
```
