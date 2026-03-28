---
title: Entity Isolation
impact: HIGH
impactDescription: 엔티티가 다른 엔티티에 의존하면 도메인 경계가 무너짐
tags: domain-fsd, entities, isolation
---

## Entity Isolation

**Impact: HIGH (엔티티가 다른 엔티티에 의존하면 도메인 경계가 무너짐)**

엔티티는 "이 객체 하나만 알아도 성립하는 로직"만 포함한다. 다른 엔티티나 피처에 의존하지 않는다.

**Incorrect (엔티티가 다른 도메인의 엔티티를 직접 import):**

```typescript
// domains/currency/entities/rate/model/schema.ts
import { userPreferencesSchema } from '../../../user/entities/preferences/model/schema';

export const rateSchema = z.object({
  base: z.string(),
  rates: z.record(z.number()),
  userFormat: userPreferencesSchema.shape.numberFormat,  // 다른 도메인 의존!
});
```

**Correct (엔티티는 자기 자신만 알면 되는 로직):**

```typescript
// domains/currency/entities/rate/model/schema.ts
export const rateSchema = z.object({
  base: z.string(),
  rates: z.record(z.number()),
  date: z.string(),
});

export type Rate = z.infer<typeof rateSchema>;
```
