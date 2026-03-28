---
title: Widget Composition
impact: MEDIUM
impactDescription: 위젯이 비즈니스 로직을 포함하면 재사용 불가
tags: domain-fsd, widgets, composition
---

## Widget Composition

**Impact: MEDIUM (위젯이 비즈니스 로직을 포함하면 재사용 불가)**

위젯은 여러 엔티티/피처를 조합하여 독립적인 UI 블록을 만드는 계층이다. 비즈니스 로직은 포함하지 않고, ViewModel을 통해 하위 계층의 데이터를 화면에 맞게 변환한다.

**Incorrect (위젯이 직접 API 호출과 비즈니스 로직 수행):**

```typescript
// domains/currency/widgets/converter/ui/ConverterWidget.tsx
function ConverterWidget() {
  const [rates, setRates] = useState({});

  useEffect(() => {
    fetch('https://api.frankfurter.app/latest')
      .then(r => r.json())
      .then(d => setRates(d.rates));
  }, []);

  const result = amount * rates[targetCurrency];
  return <div>{result}</div>;
}
```

**Correct (위젯은 ViewModel을 통해 조합만):**

```typescript
// domains/currency/widgets/converter/ui/ConverterWidget.tsx
function ConverterWidget() {
  const vm = useConverterVM();

  return (
    <div>
      <CurrencySelect value={vm.from} onChange={vm.onFromChange} />
      <AmountInput value={vm.amount} onChange={vm.onAmountChange} />
      <ConversionDisplay result={vm.convertedDisplay} rate={vm.rateDisplay} />
    </div>
  );
}
```
