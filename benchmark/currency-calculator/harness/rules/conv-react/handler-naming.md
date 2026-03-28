---
title: Handler Naming Convention
impact: MEDIUM
impactDescription: 일관된 핸들러 네이밍은 코드 가독성과 디버깅 속도를 높임
tags: react, naming, handlers, conventions
---

## Handler Naming Convention

**Impact: MEDIUM (일관된 핸들러 네이밍은 코드 가독성과 디버깅 속도를 높임)**

이벤트 핸들러 Props는 `on` 접두사, 실제 핸들러 함수는 `handle` 접두사를 사용한다.

**Incorrect (접두사 혼용):**

```typescript
// Props와 핸들러가 같은 이름
function CurrencySelect({ change, currency }) {
  return <select onChange={change}>...</select>;
}

// 핸들러에 on 접두사
function Calculator() {
  const onAmountChange = (e) => { ... };
  return <input onChange={onAmountChange} />;
}
```

**Correct (on = prop, handle = 함수):**

```typescript
// Props: onXxx
interface CurrencySelectProps {
  onCurrencyChange: (code: CurrencyCode) => void;
}

function CurrencySelect({ onCurrencyChange }: CurrencySelectProps) {
  return <select onChange={(e) => onCurrencyChange(e.target.value)}>...</select>;
}

// 핸들러 함수: handleXxx
function Calculator() {
  const handleAmountChange = (e) => { ... };
  return <input onChange={handleAmountChange} />;
}
```
