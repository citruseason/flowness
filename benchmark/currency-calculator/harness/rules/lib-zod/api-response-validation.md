---
title: API Response Validation
impact: HIGH
impactDescription: Catches contract drift between server and client at the boundary
tags: zod, api, validation, runtime
---

## API Response Validation

**Impact: HIGH (Catches contract drift between server and client at the boundary)**

Every API response must be parsed through its corresponding Zod entity schema before the data enters the application. Calling `schema.parse(json)` at the fetch boundary guarantees runtime type safety: if the server changes its response shape, the application fails fast with a clear `ZodError` instead of propagating malformed data through multiple layers.

API fetch functions belong in the Model layer (`entities/*/api/` as defined in ARCHITECTURE.md). The schema used for parsing should be the entity schema from `entities/*/model/`.

**Incorrect (no runtime validation -- trusts the server blindly):**

```typescript
// entities/currency/api/get-rates.ts
import type { ExchangeRate } from "../model/types";

export async function getRates(base: string): Promise<ExchangeRate[]> {
  const res = await fetch(`/api/rates?base=${base}`);
  if (!res.ok) throw new Error("Failed to fetch rates");
  // Casts JSON to the type without validation -- any shape mismatch is invisible
  return res.json() as Promise<ExchangeRate[]>;
}
```

**Correct (parse through Zod schema at the boundary):**

```typescript
// entities/currency/api/get-rates.ts
import { z } from "zod";
import { exchangeRateSchema } from "../model/schema";

export async function getRates(base: string) {
  const res = await fetch(`/api/rates?base=${base}`);
  if (!res.ok) throw new Error("Failed to fetch rates");
  const json = await res.json();
  // Runtime validation -- fails fast if the response shape is wrong
  return z.array(exchangeRateSchema).parse(json);
}
```
