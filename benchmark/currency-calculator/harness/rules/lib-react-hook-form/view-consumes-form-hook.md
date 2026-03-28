---
title: View Consumes Form Hook Only
impact: HIGH
impactDescription: Keeps View components pure renderers with zero business logic
tags: react-hook-form, view, presenter, separation-of-concerns, register
---

## View Consumes Form Hook Only

**Impact: HIGH (Keeps View components pure renderers with zero business logic)**

View components (located in `features/*/ui/` or `widgets/*/ui/` as defined in ARCHITECTURE.md) must never call `useForm` directly. Instead, the View imports the feature's custom form hook and destructures only the rendering API it needs: `register`, `formState.errors`, `onSubmit`, and loading/error flags.

This keeps the View a pure renderer that forwards events upward and displays data downward. The View has no knowledge of validation schemas, mutation functions, or cache invalidation.

**Incorrect (View calls useForm and useMutation directly):**

```tsx
// domains/currency/features/convert-currency/ui/ConvertCurrencyForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { convertFormSchema } from "../model/schema";
import { convertCurrency } from "../../../entities/rate/api/convert-currency";

// BAD: View owns form state, validation, and mutation -- all Presenter concerns
export function ConvertCurrencyForm() {
  const form = useForm({
    resolver: zodResolver(convertFormSchema),
    defaultValues: { base: "USD", target: "EUR", amount: 1 },
  });
  const mutation = useMutation({ mutationFn: convertCurrency });

  return (
    <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))}>
      <input {...form.register("amount")} type="number" />
      <button type="submit">Convert</button>
    </form>
  );
}
```

**Correct (View consumes the feature hook and renders only):**

```tsx
// domains/currency/features/convert-currency/ui/ConvertCurrencyForm.tsx
"use client";

import { useConvertCurrencyForm } from "../model/use-convert-currency-form";

export function ConvertCurrencyForm() {
  const { form, onSubmit, isPending } = useConvertCurrencyForm();
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit}>
      <input {...register("base")} placeholder="Base currency" />
      {errors.base && <span>{errors.base.message}</span>}

      <input {...register("target")} placeholder="Target currency" />
      {errors.target && <span>{errors.target.message}</span>}

      <input {...register("amount", { valueAsNumber: true })} type="number" />
      {errors.amount && <span>{errors.amount.message}</span>}

      <button type="submit" disabled={isPending}>
        {isPending ? "Converting..." : "Convert"}
      </button>
    </form>
  );
}
```
