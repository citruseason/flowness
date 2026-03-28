---
title: Form Hook Placement in Features
impact: CRITICAL
impactDescription: Violating this places business logic in the wrong layer and breaks the dependency hierarchy
tags: react-hook-form, useform, features, presenter, layer-boundary
---

## Form Hook Placement in Features

**Impact: CRITICAL (Violating this places business logic in the wrong layer and breaks the dependency hierarchy)**

React Hook Form's `useForm` hook manages form state, validation, and submission -- all of which are Presenter concerns. In the MVPVM + Domain-FSD architecture (see ARCHITECTURE.md), the Presenter maps to `features/*/model/`. Placing `useForm` anywhere else -- in a View component, a ViewModel, or an entity -- violates the dependency rules and scatters form logic across layers.

The feature hook must encapsulate `useForm`, `zodResolver`, and `useMutation` into a single custom hook named `use-{feature}-form.ts`. This hook returns a controlled API surface (`form`, `onSubmit`, `isPending`, `error`) that the View can consume without knowing the implementation.

**Incorrect (useForm called directly in a widget ViewModel):**

```typescript
// domains/currency/widgets/converter/model/use-converter-viewmodel.ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { convertFormSchema } from "../../../features/convert-currency/model/schema";

// BAD: ViewModel must not own form state -- this is a Presenter responsibility
export function useConverterViewModel() {
  const form = useForm({
    resolver: zodResolver(convertFormSchema),
    defaultValues: { base: "USD", target: "EUR", amount: 1 },
  });

  const mutation = useMutation({ mutationFn: convertCurrency });

  return { form, onSubmit: form.handleSubmit((d) => mutation.mutate(d)) };
}
```

**Correct (useForm encapsulated in a feature hook inside features/*/model/):**

```typescript
// domains/currency/features/convert-currency/model/use-convert-currency-form.ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { convertFormSchema, type ConvertFormValues } from "./schema";
import { convertCurrency } from "../../../entities/rate/api/convert-currency";
import { conversionQueries } from "../../../entities/conversion/api/queries";

export function useConvertCurrencyForm() {
  const queryClient = useQueryClient();

  const form = useForm<ConvertFormValues>({
    resolver: zodResolver(convertFormSchema),
    defaultValues: { base: "USD", target: "EUR", amount: 1 },
  });

  const mutation = useMutation({
    mutationFn: convertCurrency,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: conversionQueries.history().queryKey,
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    mutation.mutate(data);
  });

  return {
    form,
    onSubmit,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
```
