---
title: Mocking Strategy
impact: MEDIUM
impactDescription: Correct mocking boundaries prevent fragile tests and false confidence
tags: tdd, testing, mocking
---

## Mocking Strategy

**Impact: MEDIUM (Correct mocking boundaries prevent fragile tests and false confidence)**

Mock at system boundaries, not internal modules. Over-mocking creates tests that pass but miss real bugs.

### Mock at Boundaries

**Boundaries = where your code meets external systems:**
- HTTP calls to external APIs
- Database queries
- File system operations
- System clock (Date.now, timers)
- Third-party services

**Incorrect (mocking internal modules):**

```typescript
// Mocking your own service function — this tests nothing useful
vi.mock('../service/exchangeRateService');

test('converter calls exchange rate service', () => {
  const mockConvert = vi.mocked(convert);
  mockConvert.mockReturnValue(85);

  // This test only proves the mock works, not the actual code
  expect(convert(100, 'USD', 'EUR')).toBe(85);
});
```

**Correct (mocking the HTTP boundary):**

```typescript
// Mock the external API, not your own code
const server = setupServer(
  http.get('https://api.frankfurter.app/latest', () => {
    return HttpResponse.json({ rates: { EUR: 0.85 } });
  })
);

test('fetches rates and converts currency', async () => {
  const rates = await fetchRates('USD');
  expect(convert(100, 'USD', 'EUR', rates)).toBe(85);
});
```

### Don't Mock What You Own

If you find yourself mocking your own modules extensively, it's a signal that:
- The modules are too tightly coupled
- You should write an integration test instead
- The architecture needs refactoring

**Incorrect (mocking your own repository):**

```typescript
vi.mock('../repository/tripRepository');

test('TripService creates trip', async () => {
  // You're testing that your service calls your repository
  // If you refactor the repository, this test breaks even if behavior is correct
});
```

**Correct (test through the public interface):**

```typescript
test('creates a trip and returns it', async () => {
  const trip = await tripService.create({ name: 'Tokyo' });
  const found = await tripService.findById(trip.id);
  expect(found.name).toBe('Tokyo');
});
```

### When Mocking Is Required

| Scenario | What to mock | Why |
|---|---|---|
| External API | HTTP client / fetch | Avoid real network calls in tests |
| Time-dependent logic | Date.now, setTimeout | Make tests deterministic |
| Randomness | Math.random, crypto | Make tests reproducible |
| File system | fs operations | Avoid test pollution |
| Expensive operations | Only when tests are slow | Last resort — prefer real calls |
