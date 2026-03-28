---
title: Schema as Single Source of Truth
impact: CRITICAL
impactDescription: Prevents type/schema drift that causes silent runtime failures
tags: zod, types, schema, model
---

## Schema as Single Source of Truth

**Impact: CRITICAL (Prevents type/schema drift that causes silent runtime failures)**

Every domain entity type must be inferred from a Zod schema using `z.infer<typeof schema>`. Writing a standalone `interface` or `type` alias for the same concept creates two sources of truth that inevitably diverge, disabling runtime validation and producing bugs that TypeScript alone cannot catch.

Entity schemas belong in the Model layer (`entities/*/model/` as defined in ARCHITECTURE.md). They contain only structural and field-level validation rules -- no UI messages, no feature-specific logic.

**Incorrect (standalone interface without a Zod schema):**

```typescript
// entities/currency/model/types.ts
interface ExchangeRate {
  base: string;
  target: string;
  rate: number;
  updatedAt: Date;
}
// No runtime validation exists -- API could return anything and TypeScript will not complain at runtime.
```

**Correct (type inferred from Zod schema):**

```typescript
// entities/currency/model/schema.ts
import { z } from "zod";

export const exchangeRateSchema = z.object({
  base: z.string(),
  target: z.string(),
  rate: z.number().positive(),
  updatedAt: z.coerce.date(),
});

// Type is always in sync with the schema
export type ExchangeRate = z.infer<typeof exchangeRateSchema>;
```
