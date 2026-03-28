---
title: Model Purity
impact: HIGH
impactDescription: Model에 UI 로직이 들어가면 재사용 불가능
tags: mvpvm, model, business-logic
---

## Model Purity

**Impact: HIGH (Model에 UI 로직이 들어가면 재사용 불가능)**

Model은 비즈니스 로직, 데이터 소스, 도메인 엔티티를 담당한다. UI 표현(포매팅, 라벨, 메시지), 화면 상태(로딩, 에러 표시), 사용자 인터랙션 흐름을 포함하지 않는다.

**Incorrect (Model에 UI 포매팅 로직 포함):**

```typescript
function convert(amount: number, from: string, to: string, rates: Rates) {
  const result = amount * rates[to];
  return {
    value: result,
    display: `${result.toFixed(2)} ${to}`,  // UI 포매팅이 Model에
    icon: getCurrencyIcon(to),               // UI 관심사가 Model에
  };
}
```

**Correct (Model은 순수 비즈니스 로직만):**

```typescript
function convert(amount: number, from: string, to: string, rates: Rates) {
  return {
    value: amount * rates[to],
    rate: rates[to],
    from,
    to,
  };
}
```
