---
title: Client State Only
impact: CRITICAL
impactDescription: Storing server data in Zustand bypasses React Query cache, causing stale data and hydration mismatches
tags: zustand, server-state, client-state, react-query, cache
---

## Client State Only

**Impact: CRITICAL (Storing server data in Zustand bypasses React Query cache, causing stale data and hydration mismatches)**

Zustand must only hold client-side session state -- values that disappear on page refresh and do not need server synchronization. Examples include filter selections, sidebar open/close toggles, active tab indices, and edit mode flags.

Server-originated data (exchange rates, user profiles, persisted lists) belongs in React Query. Caching server responses in a Zustand store creates a second source of truth that does not benefit from React Query's automatic revalidation, garbage collection, or SSR hydration.

**Decision test:** would the value be lost on a full page refresh and that is acceptable? If yes, it is client state (Zustand). If no, it is server state (React Query) or URL state.

**Incorrect (server data fetched and stored in Zustand):**

```typescript
// domains/currency/use-cases/use-rate-store.ts
import { create } from "zustand";
import { getExchangeRates } from "../entities/rate/api/get-exchange-rates";

// BAD: server data cached in Zustand -- bypasses React Query cache entirely
interface RateStoreState {
  rates: Record<string, number>;
  loading: boolean;
  fetchRates: (base: string) => Promise<void>;
}

export const useRateStore = create<RateStoreState>((set) => ({
  rates: {},
  loading: false,
  fetchRates: async (base) => {
    set({ loading: true });
    const data = await getExchangeRates(base);
    set({ rates: data.rates, loading: false });
  },
}));
```

**Correct (server data in React Query, client filter state in Zustand):**

```typescript
// domains/currency/use-cases/use-currency-filter-store.ts
import { create } from "zustand";

// GOOD: only client-side UI state -- will be lost on refresh and that is fine
interface CurrencyFilterState {
  baseCurrency: string;
  targetCurrency: string;
  setBaseCurrency: (currency: string) => void;
  setTargetCurrency: (currency: string) => void;
}

export const useCurrencyFilterStore = create<CurrencyFilterState>((set) => ({
  baseCurrency: "USD",
  targetCurrency: "KRW",
  setBaseCurrency: (baseCurrency) => set({ baseCurrency }),
  setTargetCurrency: (targetCurrency) => set({ targetCurrency }),
}));
```

```typescript
// domains/currency/use-cases/use-exchange-rate.ts
import { useSuspenseQuery } from "@tanstack/react-query";
import { rateQueries } from "../entities/rate/api/queries";
import { useCurrencyFilterStore } from "./use-currency-filter-store";

// GOOD: server data stays in React Query, Zustand provides the filter parameters
export function useExchangeRate() {
  const { baseCurrency, targetCurrency } = useCurrencyFilterStore();
  return useSuspenseQuery(rateQueries.detail(baseCurrency, targetCurrency));
}
```
