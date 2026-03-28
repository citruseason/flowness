---
title: queryOptions Factory in Entities
impact: CRITICAL
impactDescription: Prevents query key drift between server prefetch and client hooks
tags: react-query, query-options, entities, model, cache
---

## queryOptions Factory in Entities

**Impact: CRITICAL (Prevents query key drift between server prefetch and client hooks)**

Every entity must define a `queryOptions` factory object in its `entities/*/api/` directory. This factory bundles `queryKey` and `queryFn` together so that SSR prefetch (server) and `useSuspenseQuery` (client) always reference the exact same cache entry. Scattering query definitions across use-cases or features makes it impossible for the server to populate the same cache the client reads from, leading to redundant fetches and hydration mismatches.

The factory should contain only cache-identity concerns: `queryKey`, `queryFn`, and optional cache policies like `staleTime` or `gcTime`. Runtime conditions like `enabled`, cross-query dependencies, and UI-specific options like `select` or `placeholderData` belong in the Presenter layer (use-cases or features).

**Incorrect (queryOptions defined in a use-case -- not reusable by server prefetch):**

```typescript
// domains/currency/use-cases/use-exchange-rates.ts
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getExchangeRates } from "../entities/rate/api/get-exchange-rates";

// BAD: factory is local to this use-case, server page.tsx cannot import it
// without creating a dependency on the Presenter layer
const rateOptions = (base: string) =>
  queryOptions({
    queryKey: ["rates", base],
    queryFn: () => getExchangeRates(base),
  });

export function useExchangeRates(base: string) {
  return useSuspenseQuery(rateOptions(base));
}
```

**Correct (queryOptions factory in entities/api, shared by server and client):**

```typescript
// domains/currency/entities/rate/api/queries.ts
import { queryOptions } from "@tanstack/react-query";
import { getExchangeRates } from "./get-exchange-rates";
import { getRate } from "./get-rate";

export const rateQueries = {
  all: (base: string) =>
    queryOptions({
      queryKey: ["rates", base],
      queryFn: () => getExchangeRates(base),
    }),

  detail: (base: string, target: string) =>
    queryOptions({
      queryKey: ["rates", base, target],
      queryFn: () => getRate(base, target),
    }),
};
```

```typescript
// domains/currency/use-cases/use-exchange-rates.ts
import { useSuspenseQuery } from "@tanstack/react-query";
import { rateQueries } from "../entities/rate/api/queries";

export function useExchangeRates(base: string) {
  return useSuspenseQuery(rateQueries.all(base));
}
```
