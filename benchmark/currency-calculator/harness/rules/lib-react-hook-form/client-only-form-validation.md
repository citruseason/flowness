---
title: Client-Only Form Validation
impact: HIGH
impactDescription: Prevents async side-effects inside the validation layer and keeps form response instant
tags: react-hook-form, zod, validation, async, mutation, server
---

## Client-Only Form Validation

**Impact: HIGH (Prevents async side-effects inside the validation layer and keeps form response instant)**

Form schemas validated via `zodResolver` must contain only synchronous, client-side validation rules. Asynchronous checks -- such as checking for duplicates via an API call, verifying server-side availability, or any operation that requires a network request -- must never appear inside the Zod schema passed to `useForm`.

Server-side validation belongs in the mutation's `onError` handler or in the `mutationFn` response. Mixing network calls into the validation schema makes the form unpredictably slow, couples the schema to server infrastructure, and makes the schema untestable without mocking.

**Incorrect (async API call inside the form schema):**

```typescript
// domains/currency/features/add-currency/model/schema.ts
import { z } from "zod";
import { checkCurrencyExists } from "../../../entities/currency/api/check-currency-exists";

export const addCurrencyFormSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(3)
    // BAD: network call inside schema validation -- blocks form, couples to API
    .refine(
      async (code) => {
        const exists = await checkCurrencyExists(code);
        return !exists;
      },
      { message: "Currency already exists" }
    ),
  name: z.string().min(1),
});
```

**Correct (schema has synchronous rules only, server validation in mutation error handling):**

```typescript
// domains/currency/features/add-currency/model/schema.ts
import { z } from "zod";
import { currencySchema } from "../../../entities/currency/model/schema";

export const addCurrencyFormSchema = currencySchema
  .pick({ code: true, name: true })
  .extend({
    code: z.string().length(3, "Currency code must be exactly 3 characters"),
    name: z.string().min(1, "Currency name is required"),
  });

export type AddCurrencyFormValues = z.infer<typeof addCurrencyFormSchema>;
```

```typescript
// domains/currency/features/add-currency/model/use-add-currency-form.ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addCurrencyFormSchema, type AddCurrencyFormValues } from "./schema";
import { addCurrency } from "../../../entities/currency/api/add-currency";
import { currencyQueries } from "../../../entities/currency/api/queries";

export function useAddCurrencyForm() {
  const queryClient = useQueryClient();

  const form = useForm<AddCurrencyFormValues>({
    resolver: zodResolver(addCurrencyFormSchema),
    defaultValues: { code: "", name: "" },
  });

  const mutation = useMutation({
    mutationFn: addCurrency,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: currencyQueries.all().queryKey,
      });
    },
    onError: (error) => {
      // Server-side duplicate check handled here, not in the schema
      if (error.message.includes("DUPLICATE")) {
        form.setError("code", { message: "Currency already exists" });
      }
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    mutation.mutate(data);
  });

  return { form, onSubmit, isPending: mutation.isPending };
}
```
