---
title: Query Key Conventions
impact: MEDIUM
impactDescription: Prevents cache collisions and enables granular invalidation
tags: react-query, query-key, cache, invalidation, naming
---

## Query Key Conventions

**Impact: MEDIUM (Prevents cache collisions and enables granular invalidation)**

Query keys must be defined exclusively inside the entity `queryOptions` factory. No other layer may construct query keys manually. This makes the factory the single source of truth for cache identity, ensuring that reads and invalidations always target the same entries.

Keys should be structured hierarchically -- broad to narrow -- so that `invalidateQueries` can target a whole entity scope or a specific entry:

- `["rates"]` -- invalidates all rate queries
- `["rates", "USD"]` -- invalidates rates for a specific base currency
- `["rates", "USD", "EUR"]` -- invalidates a specific currency pair

Parameters should be placed at the end of the key array. Optional filter objects should be included as a single object element so that React Query's structural matching works correctly.

**Incorrect (query keys constructed ad-hoc outside the factory):**

```typescript
// domains/currency/use-cases/use-exchange-rates.ts
import { useSuspenseQuery } from "@tanstack/react-query";
import { getExchangeRates } from "../entities/rate/api/get-exchange-rates";

export function useExchangeRates(base: string) {
  // BAD: queryKey assembled manually -- may drift from the factory
  return useSuspenseQuery({
    queryKey: ["exchangeRates", base],
    queryFn: () => getExchangeRates(base),
  });
}
```

```typescript
// domains/currency/features/set-base-currency/model/use-set-base-currency.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useSetBaseCurrency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBaseCurrency,
    onSuccess: () => {
      // BAD: key string does not match the factory's "rates"
      queryClient.invalidateQueries({ queryKey: ["exchangeRates"] });
    },
  });
}
```

**Correct (all keys sourced from the entity queryOptions factory):**

```typescript
// domains/currency/entities/rate/api/queries.ts
import { queryOptions } from "@tanstack/react-query";
import { getExchangeRates } from "./get-exchange-rates";
import { getRate } from "./get-rate";

export const rateQueries = {
  // Broad scope -- invalidating ["rates"] clears all entries below
  all: (base: string) =>
    queryOptions({
      queryKey: ["rates", base],
      queryFn: () => getExchangeRates(base),
    }),

  // Narrow scope -- specific pair
  detail: (base: string, target: string) =>
    queryOptions({
      queryKey: ["rates", base, target],
      queryFn: () => getRate(base, target),
    }),
};
```

```typescript
// Invalidation always references the factory
queryClient.invalidateQueries({
  queryKey: rateQueries.all("USD").queryKey,
});
```
