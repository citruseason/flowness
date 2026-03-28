---
title: zodResolver with Derived Schema
impact: HIGH
impactDescription: Prevents validation drift between entity definition and form contract
tags: react-hook-form, zod, zodresolver, schema, derivation, entity
---

## zodResolver with Derived Schema

**Impact: HIGH (Prevents validation drift between entity definition and form contract)**

Every `useForm` call must use `zodResolver` with a schema that is derived from the corresponding entity schema. This ties form validation structurally to the entity definition so that when a field type or constraint changes in the entity schema, the form schema inherits the change automatically.

The form schema lives in the feature's model directory (`features/*/model/schema.ts` as defined in ARCHITECTURE.md) and uses Zod composition methods (`.pick()`, `.omit()`, `.extend()`, `.refine()`) to narrow or augment the entity schema. Inline validation rules or independently defined schemas are not allowed because they create a parallel type system that silently drifts.

This rule complements the Zod rule on Form Schema Derivation (see `lib-zod/form-schema-derivation.md`).

**Incorrect (form schema defined independently with manual field duplication):**

```typescript
// domains/currency/features/convert-currency/model/use-convert-currency-form.ts
import { useForm } from "react-hook-form";
import { z } from "zod";

// BAD: schema duplicates entity fields and adds zodResolver inline
const schema = z.object({
  base: z.string(),
  target: z.string(),
  amount: z.number().positive(),
});

export function useConvertCurrencyForm() {
  const form = useForm({
    // BAD: no zodResolver -- relies on manual validation or inline schema
    defaultValues: { base: "USD", target: "EUR", amount: 1 },
  });
  // ...
}
```

**Correct (zodResolver with schema derived from entity schema):**

```typescript
// domains/currency/features/convert-currency/model/schema.ts
import { exchangeRateSchema } from "../../../entities/currency/model/schema";

export const convertFormSchema = exchangeRateSchema
  .pick({ base: true, target: true })
  .extend({
    amount: exchangeRateSchema.shape.amount,
  })
  .refine((data) => data.base !== data.target, {
    message: "Base and target currencies must be different",
    path: ["target"],
  });

export type ConvertFormValues = z.infer<typeof convertFormSchema>;
```

```typescript
// domains/currency/features/convert-currency/model/use-convert-currency-form.ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { convertFormSchema, type ConvertFormValues } from "./schema";

export function useConvertCurrencyForm() {
  const form = useForm<ConvertFormValues>({
    resolver: zodResolver(convertFormSchema),
    defaultValues: { base: "USD", target: "EUR", amount: 1 },
  });
  // ...
}
```
