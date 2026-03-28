---
title: Form Schema Derivation
impact: HIGH
impactDescription: Eliminates sync drift between entity definition and form validation
tags: zod, form, schema, derivation, presenter
---

## Form Schema Derivation

**Impact: HIGH (Eliminates sync drift between entity definition and form validation)**

Form validation schemas must be derived from the entity schema using Zod composition methods (`.pick()`, `.omit()`, `.extend()`, `.refine()`). This keeps the form contract structurally linked to the entity: when a field type changes in the entity schema, the form schema picks up the change automatically.

Form schemas belong in the Presenter/Feature layer (`features/*/model/` as defined in ARCHITECTURE.md). UI-specific error messages and cross-field validations are added only at this level.

**Incorrect (form schema defined independently from the entity schema):**

```typescript
// features/convert-currency/model/schema.ts
import { z } from "zod";

// Duplicates field definitions -- will not update if the entity schema changes
export const convertFormSchema = z.object({
  base: z.string().min(1, "Select a base currency"),
  target: z.string().min(1, "Select a target currency"),
  amount: z.number().positive("Amount must be positive"),
});

export type ConvertFormValues = z.infer<typeof convertFormSchema>;
```

**Correct (form schema derived from entity schema with UI messages added):**

```typescript
// features/convert-currency/model/schema.ts
import { z } from "zod";
import { exchangeRateSchema } from "../../entities/currency/model/schema";

// Derive from entity schema -- stays in sync automatically
export const convertFormSchema = exchangeRateSchema
  .pick({ base: true, target: true })
  .extend({
    base: z.string().min(1, "Select a base currency"),
    target: z.string().min(1, "Select a target currency"),
    amount: z.number().positive("Amount must be positive"),
  })
  .refine((data) => data.base !== data.target, {
    message: "Base and target currencies must be different",
    path: ["target"],
  });

export type ConvertFormValues = z.infer<typeof convertFormSchema>;
```
