---
title: Forbidden Store Layers
impact: HIGH
impactDescription: Stores in wrong layers break the Domain-FSD dependency hierarchy and mix concerns
tags: zustand, entities, features, view, domain-fsd, architecture
---

## Forbidden Store Layers

**Impact: HIGH (Stores in wrong layers break the Domain-FSD dependency hierarchy and mix concerns)**

Zustand stores must not be defined in the following Domain-FSD layers:

- **entities/** -- Entities hold server-state definitions (types, schemas, API queries). Placing UI state here mixes Model and Presenter concerns and forces the lowest layer to depend on Zustand.
- **features/** -- Features are atomic, single-mutation actions. They should not own shared state; they may *read* from a use-cases store but never *define* one.
- **widgets/*/ui/** -- View files are pure rendering components. Store creation is a Presenter/ViewModel concern that belongs in `widgets/*/model/`.

Stores may only live in `use-cases/` (shared) or `widgets/*/model/` (widget-local), as defined in ARCHITECTURE.md's MVPVM layer mapping.

**Incorrect (store defined in entities layer):**

```typescript
// domains/currency/entities/rate/model/use-rate-ui-store.ts
import { create } from "zustand";

// BAD: entities/ is the Model layer -- it must not hold UI state
interface RateUIState {
  selectedRateId: string | null;
  setSelectedRateId: (id: string | null) => void;
}

export const useRateUIStore = create<RateUIState>((set) => ({
  selectedRateId: null,
  setSelectedRateId: (selectedRateId) => set({ selectedRateId }),
}));
```

**Correct (store moved to use-cases for shared access):**

```typescript
// domains/currency/use-cases/use-rate-selection-store.ts
import { create } from "zustand";

// GOOD: use-cases/ is the Presenter layer -- appropriate for shared UI state
interface RateSelectionState {
  selectedRateId: string | null;
  setSelectedRateId: (id: string | null) => void;
}

export const useRateSelectionStore = create<RateSelectionState>((set) => ({
  selectedRateId: null,
  setSelectedRateId: (selectedRateId) => set({ selectedRateId }),
}));
```
