---
title: Test Structure
impact: HIGH
impactDescription: Consistent test structure improves readability and debugging
tags: tdd, testing, structure, naming
---

## 테스트 구조

**영향도: 높음 (일관된 테스트 구조는 가독성과 디버깅을 향상시킵니다)**

테스트는 서술적인 이름과 함께 Arrange-Act-Assert (AAA) 패턴을 따릅니다.

### 명명 규칙

테스트 이름은 구현이 아닌 동작을 설명해야 합니다.

**잘못된 예 (구현 중심 명명):**

```typescript
test('calls fetchRates and returns data', () => { ... });
test('TripService.create test', () => { ... });
test('test1', () => { ... });
```

**올바른 예 (동작 중심 명명):**

```typescript
test('converts 100 USD to EUR using current exchange rate', () => { ... });
test('creates a trip with valid name and date range', () => { ... });
test('shows error message when API is unavailable', () => { ... });
```

### AAA 패턴

각 테스트는 세 가지 명확한 섹션으로 구성됩니다.

**잘못된 예 (관심사 혼합):**

```typescript
test('converts currency', () => {
  const service = new ExchangeService();
  service.setRates({ USD: 1, EUR: 0.85 });
  const result = service.convert(100, 'USD', 'EUR');
  expect(result).toBe(85);
  const result2 = service.convert(0, 'USD', 'EUR');
  expect(result2).toBe(0);
});
```

**올바른 예 (명확한 AAA 분리):**

```typescript
test('converts 100 USD to EUR at 0.85 rate', () => {
  // Arrange
  const rates = { USD: 1, EUR: 0.85 };

  // Act
  const result = convert(100, 'USD', 'EUR', rates);

  // Assert
  expect(result).toBe(85);
});

test('converts zero amount to zero', () => {
  // Arrange
  const rates = { USD: 1, EUR: 0.85 };

  // Act
  const result = convert(0, 'USD', 'EUR', rates);

  // Assert
  expect(result).toBe(0);
});
```

### 테스트 구성

관련된 테스트를 테스트 대상 기능이나 모듈을 반영하는 `describe` 블록으로 그룹화합니다.

**잘못된 예 (평면적, 비구조적):**

```typescript
test('create trip', () => { ... });
test('delete trip', () => { ... });
test('create trip fails without name', () => { ... });
test('list trips', () => { ... });
```

**올바른 예 (기능별 그룹화):**

```typescript
describe('Trip Management', () => {
  describe('create', () => {
    test('creates a trip with valid name and date range', () => { ... });
    test('rejects trip without a name', () => { ... });
  });

  describe('delete', () => {
    test('deletes an existing trip', () => { ... });
  });

  describe('list', () => {
    test('returns all trips sorted by last modified', () => { ... });
  });
});
```
