---
title: Test Structure
impact: HIGH
impactDescription: Consistent test structure improves readability and debugging
tags: tdd, testing, structure, naming
---

## Test Structure

**Impact: HIGH (Consistent test structure improves readability and debugging)**

Tests follow the Arrange-Act-Assert (AAA) pattern with descriptive naming.

### Naming Convention

Test names should describe the behavior, not the implementation.

**Incorrect (implementation-focused naming):**

```typescript
test('calls fetchRates and returns data', () => { ... });
test('TripService.create test', () => { ... });
test('test1', () => { ... });
```

**Correct (behavior-focused naming):**

```typescript
test('converts 100 USD to EUR using current exchange rate', () => { ... });
test('creates a trip with valid name and date range', () => { ... });
test('shows error message when API is unavailable', () => { ... });
```

### AAA Pattern

Each test has three distinct sections.

**Incorrect (mixed concerns):**

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

**Correct (clear AAA separation):**

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

### Test Organization

Group related tests using `describe` blocks that mirror the feature or module being tested.

**Incorrect (flat, unorganized):**

```typescript
test('create trip', () => { ... });
test('delete trip', () => { ... });
test('create trip fails without name', () => { ... });
test('list trips', () => { ... });
```

**Correct (grouped by feature):**

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
