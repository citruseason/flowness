---
title: Presenter Orchestration Only
impact: HIGH
impactDescription: Presenter가 UI 상태를 관리하면 Fat Presenter가 됨
tags: mvpvm, presenter, orchestration
---

## Presenter Orchestration Only

**Impact: HIGH (Presenter가 UI 상태를 관리하면 Fat Presenter가 됨)**

Presenter는 비즈니스 흐름을 제어하고 Model과 ViewModel 사이를 중재한다. UI 상태 관리(로딩, 포매팅, 가시성)는 ViewModel의 책임이다.

**Incorrect (Presenter가 UI 상태까지 관리):**

```typescript
function useCurrencyConverter() {
  const [isLoading, setIsLoading] = useState(false);
  const [formattedResult, setFormattedResult] = useState('');

  const convert = async (amount, from, to) => {
    setIsLoading(true);
    const rates = await fetchRates(from);
    const result = amount * rates[to];
    setFormattedResult(`${result.toFixed(2)} ${to}`);
    setIsLoading(false);
  };

  return { isLoading, formattedResult, convert };
}
```

**Correct (Presenter는 흐름 제어, ViewModel이 UI 상태):**

```typescript
// Presenter (use-case) — 흐름 제어만
function useCurrencyConversion(from, to, amount) {
  return useSuspenseQuery(
    currencyQueryOptions(from, to, amount)
  );
}

// ViewModel — UI 상태 변환
function useCurrencyCalculatorVM() {
  const { data } = useCurrencyConversion(from, to, amount);

  return {
    convertedDisplay: `${data.result.toFixed(2)} ${to}`,
    rateDisplay: `1 ${from} = ${data.rate} ${to}`,
  };
}
```
