---
title: Entity Schema Purity
impact: MEDIUM
impactDescription: Keeps the Model layer reusable and free from UI coupling
tags: zod, schema, entity, separation, model
---

## Entity Schema Purity

**Impact: MEDIUM (Keeps the Model layer reusable and free from UI coupling)**

Entity schemas in the Model layer must not contain UI-specific error messages. Error strings like "Please enter a title" are presentation concerns -- they belong in form schemas at the Feature/Presenter layer. Embedding them in the entity schema couples the Model to a specific UI, preventing reuse across different features and making localization harder.

Entity schemas belong in `entities/*/model/` and should contain only structural validation (min, max, regex, enum values) without human-facing messages. Form schemas in `features/*/model/` add messages when they derive from the entity schema.

**Incorrect (UI error messages in the entity schema):**

```typescript
// entities/currency/model/schema.ts
import { z } from "zod";

export const currencySchema = z.object({
  code: z.string().length(3, "Currency code must be exactly 3 characters"),
  name: z.string().min(1, "Currency name is required"),
  symbol: z.string().min(1, "Symbol is required"),
});

export type Currency = z.infer<typeof currencySchema>;
```

**Correct (entity schema with pure structural validation):**

```typescript
// entities/currency/model/schema.ts
import { z } from "zod";

// Pure structural validation -- no UI messages
export const currencySchema = z.object({
  code: z.string().length(3),
  name: z.string().min(1),
  symbol: z.string().min(1),
});

export type Currency = z.infer<typeof currencySchema>;
```

```typescript
// features/add-currency/model/schema.ts
import { z } from "zod";
import { currencySchema } from "../../entities/currency/model/schema";

// UI messages added only at the feature level
export const addCurrencyFormSchema = currencySchema.extend({
  code: z.string().length(3, "Currency code must be exactly 3 characters"),
  name: z.string().min(1, "Currency name is required"),
});

export type AddCurrencyFormValues = z.infer<typeof addCurrencyFormSchema>;
```
