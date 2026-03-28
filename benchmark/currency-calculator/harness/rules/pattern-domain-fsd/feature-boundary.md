---
title: Feature Boundary
impact: HIGH
impactDescription: 피처 간 의존은 결합도를 높이고 독립 배포/테스트를 불가능하게 함
tags: domain-fsd, features, boundary
---

## Feature Boundary

**Impact: HIGH (피처 간 의존은 결합도를 높이고 독립 배포/테스트를 불가능하게 함)**

피처는 사용자가 수행하는 "행동 단위"이다. 각 피처는 독립적이며, 다른 피처를 직접 import하지 않는다. 피처 간 조합이 필요하면 상위 계층(widgets 또는 use-cases)에서 처리한다.

**Incorrect (피처가 다른 피처를 직접 import):**

```typescript
// domains/currency/features/convert/model/useConvert.ts
import { useHistory } from '../../history/model/useHistory';
// 다른 피처에 직접 의존 — 경계 위반!

export function useConvert() {
  const history = useHistory();
  // ...
}
```

**Correct (조합은 use-cases에서):**

```typescript
// domains/currency/features/convert/model/useConvert.ts
export function useConvert() {
  // 자체 로직만 포함
}

// domains/currency/use-cases/useConvertWithHistory.ts
import { useConvert } from '../features/convert/model/useConvert';
import { useHistory } from '../features/history/model/useHistory';

export function useConvertWithHistory() {
  const convert = useConvert();
  const history = useHistory();
  // 여기서 조합
}
```
