---
title: Edit Form Server Defaults
impact: MEDIUM
impactDescription: Ensures edit forms always initialize with current server state
tags: react-hook-form, edit, defaultvalues, suspense-query, server-state
---

## Edit Form Server Defaults

**Impact: MEDIUM (Ensures edit forms always initialize with current server state)**

When building an edit/update form, `defaultValues` must be populated from server data fetched via `useSuspenseQuery`. This guarantees the form always reflects the latest persisted state before the user starts editing. The Suspense boundary in the parent widget ensures that data is available synchronously by the time the form hook runs, so there is no need for conditional logic or loading states inside the hook.

The edit form hook follows the same structure as a create form hook -- `useForm` + `zodResolver` + `useMutation` -- but accepts an identifier parameter (e.g., `currencyCode`) used to fetch the existing record and target the update mutation.

**Incorrect (defaultValues hardcoded or derived from props without server fetch):**

```typescript
// domains/currency/features/edit-currency/model/use-edit-currency-form.ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { editCurrencyFormSchema } from "./schema";

// BAD: takes props as defaults -- may be stale, bypasses server as source of truth
export function useEditCurrencyForm(initialData: { code: string; name: string }) {
  const form = useForm({
    resolver: zodResolver(editCurrencyFormSchema),
    defaultValues: {
      code: initialData.code,
      name: initialData.name,
    },
  });

  // ...
}
```

**Correct (defaultValues from useSuspenseQuery, mutation targets the update endpoint):**

```typescript
// domains/currency/features/edit-currency/model/use-edit-currency-form.ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { editCurrencyFormSchema, type EditCurrencyFormValues } from "./schema";
import { updateCurrency } from "../../../entities/currency/api/update-currency";
import { currencyQueries } from "../../../entities/currency/api/queries";

export function useEditCurrencyForm(currencyCode: string) {
  const queryClient = useQueryClient();

  // Suspense boundary guarantees data is available
  const { data: currency } = useSuspenseQuery(
    currencyQueries.detail(currencyCode)
  );

  const form = useForm<EditCurrencyFormValues>({
    resolver: zodResolver(editCurrencyFormSchema),
    defaultValues: {
      code: currency.code,
      name: currency.name,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: EditCurrencyFormValues) =>
      updateCurrency(currencyCode, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: currencyQueries.detail(currencyCode).queryKey,
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
