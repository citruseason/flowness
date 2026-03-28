---
title: ViewModel Query Boundary
impact: MEDIUM
impactDescription: Keeps the ViewModel layer focused on UI transformation without data-fetching concerns
tags: react-query, viewmodel, mvpvm, separation, use-cases
---

## ViewModel Query Boundary

**Impact: MEDIUM (Keeps the ViewModel layer focused on UI transformation without data-fetching concerns)**

ViewModels (in `widgets/*/model/`) must never import or call React Query hooks (`useSuspenseQuery`, `useMutation`, `useQueryClient`) directly. Their role is to receive data from use-case or feature hooks and transform it for the View. When a ViewModel calls React Query directly, it takes on Presenter responsibilities, blurring the boundary between orchestration and UI state transformation.

Similarly, View components (in `widgets/*/ui/`) must never call React Query hooks. They receive props from the ViewModel and render UI.

**Incorrect (ViewModel calling useSuspenseQuery directly):**

```typescript
// domains/currency/widgets/converter/model/use-converter-vm.ts
import { useSuspenseQuery } from "@tanstack/react-query";
import { rateQueries } from "../../../entities/rate/api/queries";

export function useConverterVM(base: string, target: string, amount: number) {
  // BAD: ViewModel is doing data fetching -- this is Presenter work
  const { data: rates } = useSuspenseQuery(rateQueries.all(base));

  const rate = rates.find((r) => r.target === target);
  const result = rate ? amount * rate.value : 0;

  return {
    formattedResult: result.toFixed(2),
    rateDisplay: rate ? `1 ${base} = ${rate.value} ${target}` : "--",
  };
}
```

**Correct (ViewModel consumes a use-case hook and focuses on UI transformation):**

```typescript
// domains/currency/use-cases/use-converter-data.ts
import { useSuspenseQuery } from "@tanstack/react-query";
import { rateQueries } from "../entities/rate/api/queries";

export function useConverterData(base: string) {
  const { data } = useSuspenseQuery(rateQueries.all(base));
  return { rates: data };
}
```

```typescript
// domains/currency/widgets/converter/model/use-converter-vm.ts
import { useConverterData } from "../../../use-cases/use-converter-data";
import { useSetBaseCurrency } from "../../../features/set-base-currency/model/use-set-base-currency";

export function useConverterVM(base: string, target: string, amount: number) {
  // GOOD: delegates data fetching to the use-case (Presenter layer)
  const { rates } = useConverterData(base);
  const { setBase, isPending } = useSetBaseCurrency();

  const rate = rates.find((r) => r.target === target);
  const result = rate ? amount * rate.value : 0;

  return {
    formattedResult: result.toFixed(2),
    rateDisplay: rate ? `1 ${base} = ${rate.value} ${target}` : "--",
    onBaseChange: setBase,
    isUpdating: isPending,
  };
}
```
