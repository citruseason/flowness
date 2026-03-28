---
title: Mutation Placement
impact: HIGH
impactDescription: Maintains proper layer separation for write operations
tags: react-query, mutation, use-mutation, features, use-cases, invalidation
---

## Mutation Placement

**Impact: HIGH (Maintains proper layer separation for write operations)**

Mutations must follow the same layer rules as the rest of the architecture. A single write action that belongs to one feature lives in `features/*/model/`. A mutation that orchestrates multiple write operations or spans multiple entities belongs in `use-cases/`.

In both cases, the `mutationFn` must reference a fetch function from `entities/*/api/` -- never call `fetch` directly. Cache invalidation must use `queryKey` from the entity `queryOptions` factory to stay in sync with read queries.

**Incorrect (fetch called directly inside mutationFn):**

```typescript
// domains/currency/features/set-base-currency/model/use-set-base-currency.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useSetBaseCurrency() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    // BAD: raw fetch inside mutationFn bypasses the entity API boundary
    mutationFn: (currencyCode: string) =>
      fetch(`/api/preferences/base-currency`, {
        method: "PUT",
        body: JSON.stringify({ code: currencyCode }),
      }),
    onSuccess: () => {
      // BAD: hardcoded queryKey may drift from rateQueries definition
      queryClient.invalidateQueries({ queryKey: ["rates"] });
    },
  });

  return { setBase: mutation.mutate, isPending: mutation.isPending };
}
```

**Correct (single mutation in features, referencing entity API and query keys):**

```typescript
// domains/currency/features/set-base-currency/model/use-set-base-currency.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBaseCurrency } from "../../../entities/preference/api/update-base-currency";
import { rateQueries } from "../../../entities/rate/api/queries";

export function useSetBaseCurrency() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (currencyCode: string) => updateBaseCurrency(currencyCode),
    onSuccess: (_data, currencyCode) => {
      queryClient.invalidateQueries({
        queryKey: rateQueries.all(currencyCode).queryKey,
      });
    },
  });

  return { setBase: mutation.mutate, isPending: mutation.isPending };
}
```

**Correct (complex mutation in use-cases, orchestrating multiple entities):**

```typescript
// domains/currency/use-cases/use-reset-and-convert.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBaseCurrency } from "../entities/preference/api/update-base-currency";
import { convertAmount } from "../entities/rate/api/convert-amount";
import { rateQueries } from "../entities/rate/api/queries";
import { conversionQueries } from "../entities/conversion/api/queries";

export function useResetAndConvert() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: { base: string; target: string; amount: number }) => {
      await updateBaseCurrency(params.base);
      return convertAmount(params.base, params.target, params.amount);
    },
    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({ queryKey: rateQueries.all(params.base).queryKey });
      queryClient.invalidateQueries({ queryKey: conversionQueries.history().queryKey });
    },
  });

  return {
    resetAndConvert: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
```
