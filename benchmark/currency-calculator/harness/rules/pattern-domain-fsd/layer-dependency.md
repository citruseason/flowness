---
title: Layer Dependency Direction
impact: CRITICAL
impactDescription: 역방향 의존은 순환 참조와 결합도 폭발을 유발
tags: domain-fsd, layers, dependency, architecture
---

## Layer Dependency Direction

**Impact: CRITICAL (역방향 의존은 순환 참조와 결합도 폭발을 유발)**

도메인 내부 4계층의 의존 방향은 단방향이다. 상위 계층이 하위 계층을 import할 수 없다.

```
entities (최하위) → features → widgets → use-cases (최상위)
```

- entities는 다른 계층에 의존하지 않는다
- features는 entities만 import 가능
- widgets는 entities, features를 import 가능
- use-cases는 모든 하위 계층을 import 가능

**Incorrect (features가 widgets를 import — 역방향):**

```typescript
// domains/currency/features/convert/model/useConvert.ts
import { CurrencyWidget } from '../../widgets/currency-display/ui/CurrencyWidget';
// widgets는 features보다 상위 계층 — 역방향 의존!
```

**Correct (features는 entities만 import):**

```typescript
// domains/currency/features/convert/model/useConvert.ts
import { currencySchema } from '../../entities/currency/model/schema';
import { fetchRates } from '../../entities/currency/api/queries';
```
