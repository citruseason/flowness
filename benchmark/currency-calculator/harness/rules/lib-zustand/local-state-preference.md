---
title: Local State Preference
impact: MEDIUM
impactDescription: Overusing Zustand for trivial state adds unnecessary complexity and global coupling
tags: zustand, usestate, local-state, component, simplicity
---

## Local State Preference

**Impact: MEDIUM (Overusing Zustand for trivial state adds unnecessary complexity and global coupling)**

Not every piece of state needs a Zustand store. State that is scoped to a single component and has no subscribers outside that component should use React's built-in `useState` or `useReducer`. Creating a global store for component-local concerns (counters, input focus, tooltip visibility) introduces unnecessary indirection and makes the component harder to test and reuse.

**Decision test:** does any other component or hook need to read or write this state? If no, use `useState`. If yes, consider whether a simple prop/callback is sufficient before reaching for Zustand.

**Incorrect (trivial component-local state in a Zustand store):**

```typescript
// domains/currency/widgets/converter/model/use-amount-input-store.ts
import { create } from "zustand";

// BAD: input value is only used by the converter form -- no other widget reads it
interface AmountInputState {
  amount: string;
  setAmount: (amount: string) => void;
}

export const useAmountInputStore = create<AmountInputState>((set) => ({
  amount: "",
  setAmount: (amount) => set({ amount }),
}));
```

```typescript
// domains/currency/widgets/converter/ui/amount-input.tsx
import { useAmountInputStore } from "../model/use-amount-input-store";

// BAD: global store for a simple input value
export function AmountInput() {
  const { amount, setAmount } = useAmountInputStore();
  return <input value={amount} onChange={(e) => setAmount(e.target.value)} />;
}
```

**Correct (component-local state with useState):**

```typescript
// domains/currency/widgets/converter/ui/amount-input.tsx
import { useState } from "react";

// GOOD: state is local to this component, no external subscribers
export function AmountInput({
  onAmountChange,
}: {
  onAmountChange: (amount: string) => void;
}) {
  const [amount, setAmount] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    onAmountChange(e.target.value);
  };

  return <input value={amount} onChange={handleChange} />;
}
```
