---
title: View Purity
impact: CRITICAL
impactDescription: View에 로직이 섞이면 테스트 불가능, 재사용 불가능
tags: mvpvm, view, separation-of-concerns
---

## View Purity

**Impact: CRITICAL (View에 로직이 섞이면 테스트 불가능, 재사용 불가능)**

View는 ViewModel의 상태를 화면에 렌더링하고 사용자 이벤트를 Presenter에 전달하는 역할만 한다. 비즈니스 로직, 데이터 페칭, 상태 계산을 View에 넣지 않는다.

**Incorrect (View에 비즈니스 로직과 데이터 페칭이 혼재):**

```typescript
function CurrencyCalculator() {
  const [rates, setRates] = useState({});
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    fetch('https://api.frankfurter.app/latest?from=USD')
      .then(res => res.json())
      .then(data => setRates(data.rates));
  }, []);

  const converted = amount * (rates['EUR'] || 0);
  const formatted = `${converted.toFixed(2)} EUR`;

  return <div>{formatted}</div>;
}
```

**Correct (View는 ViewModel을 렌더링만):**

```typescript
function CurrencyCalculator() {
  const vm = useCurrencyCalculatorVM();

  return (
    <div>
      <input value={vm.amount} onChange={vm.onAmountChange} />
      <span>{vm.convertedDisplay}</span>
    </div>
  );
}
```
