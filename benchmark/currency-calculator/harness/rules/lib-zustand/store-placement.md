---
title: Store Placement by Sharing Scope
impact: CRITICAL
impactDescription: Misplaced stores break the Domain-FSD dependency hierarchy and cause import cycles
tags: zustand, store, placement, use-cases, widgets, domain-fsd
---

## Store Placement by Sharing Scope

**Impact: CRITICAL (Misplaced stores break the Domain-FSD dependency hierarchy and cause import cycles)**

Zustand stores must be placed based on their sharing scope. A store consumed by multiple widgets belongs in `use-cases/` (Presenter layer). A store used by a single widget belongs in that widget's `model/` directory. This mirrors the MVPVM layer mapping defined in ARCHITECTURE.md: use-cases orchestrate across widgets, while widget models hold widget-private state.

Misplacing a shared store inside a widget forces sibling widgets to import across widget boundaries, violating the Domain-FSD dependency rules.

**Incorrect (shared store placed inside a single widget -- forces cross-widget imports):**

```typescript
// domains/currency/widgets/converter/model/use-currency-filter-store.ts
import { create } from "zustand";

// BAD: this store is used by both the converter widget and the rate-list widget,
// but it lives inside converter/model/ -- rate-list must import across widget boundaries
interface CurrencyFilterState {
  baseCurrency: string;
  setBaseCurrency: (currency: string) => void;
}

export const useCurrencyFilterStore = create<CurrencyFilterState>((set) => ({
  baseCurrency: "USD",
  setBaseCurrency: (baseCurrency) => set({ baseCurrency }),
}));
```

**Correct (shared store in use-cases/, widget-local store in widgets/*/model/):**

```typescript
// domains/currency/use-cases/use-currency-filter-store.ts
import { create } from "zustand";

// GOOD: shared across multiple widgets, placed in use-cases/
interface CurrencyFilterState {
  baseCurrency: string;
  setBaseCurrency: (currency: string) => void;
}

export const useCurrencyFilterStore = create<CurrencyFilterState>((set) => ({
  baseCurrency: "USD",
  setBaseCurrency: (baseCurrency) => set({ baseCurrency }),
}));
```

```typescript
// domains/currency/widgets/converter/model/use-converter-panel-store.ts
import { create } from "zustand";

// GOOD: only used within the converter widget, placed in its model/
interface ConverterPanelState {
  isAdvancedMode: boolean;
  toggleAdvancedMode: () => void;
}

export const useConverterPanelStore = create<ConverterPanelState>((set) => ({
  isAdvancedMode: false,
  toggleAdvancedMode: () => set((s) => ({ isAdvancedMode: !s.isAdvancedMode })),
}));
```
