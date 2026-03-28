---
title: ViewModel Binding Only
impact: HIGH
impactDescription: ViewModel이 데이터를 직접 페칭하면 책임 경계가 무너짐
tags: mvpvm, viewmodel, binding
---

## ViewModel Binding Only

**Impact: HIGH (ViewModel이 데이터를 직접 페칭하면 책임 경계가 무너짐)**

ViewModel은 Presenter로부터 받은 데이터를 View에 적합한 형태로 변환한다. 데이터 페칭, API 호출, 비즈니스 로직을 수행하지 않는다.

**Incorrect (ViewModel이 직접 데이터 페칭):**

```typescript
function useCurrencyVM() {
  const [rates, setRates] = useState({});

  useEffect(() => {
    fetchRates('USD').then(setRates);
  }, []);

  return {
    rateDisplay: `1 USD = ${rates['EUR']} EUR`,
  };
}
```

**Correct (ViewModel은 변환만):**

```typescript
function useCurrencyVM(conversionResult: ConversionResult) {
  return {
    convertedDisplay: `${conversionResult.result.toFixed(2)} ${conversionResult.to}`,
    rateDisplay: `1 ${conversionResult.from} = ${conversionResult.rate} ${conversionResult.to}`,
    lastUpdated: new Date(conversionResult.date).toLocaleDateString(),
  };
}
```
