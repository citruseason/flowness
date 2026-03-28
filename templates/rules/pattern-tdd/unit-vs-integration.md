---
title: Unit vs Integration Tests
impact: HIGH
impactDescription: Right test type at right layer prevents fragile tests and missed bugs
tags: tdd, testing, unit, integration
---

## Unit vs Integration Tests

**Impact: HIGH (Right test type at right layer prevents fragile tests and missed bugs)**

Choose the test type based on what you're testing.

### Unit Tests

Test a single function, module, or component in isolation. Dependencies are mocked or stubbed.

**Use for:**
- Pure business logic (calculations, transformations, validations)
- Utility functions
- Individual UI components (rendering, user interaction)
- State management logic

**Incorrect (integration test disguised as unit test):**

```typescript
// This tests the whole stack — not a unit test
test('converts currency', async () => {
  const result = await fetch('/api/convert?from=USD&to=EUR&amount=100');
  const data = await result.json();
  expect(data.result).toBe(85);
});
```

**Correct (isolated unit test):**

```typescript
test('converts 100 USD to EUR at 0.85 rate', () => {
  const rates = { USD: 1, EUR: 0.85 };
  expect(convert(100, 'USD', 'EUR', rates)).toBe(85);
});
```

### Integration Tests

Test how multiple modules work together. Use real dependencies where practical.

**Use for:**
- API endpoint behavior (request → response)
- Database operations (CRUD workflows)
- Multi-component user flows
- External service integration

**Incorrect (mocking everything in an integration test):**

```typescript
test('user can create a trip', async () => {
  const mockDb = { insert: vi.fn() };
  const mockAuth = { getUser: vi.fn(() => ({ id: '1' })) };
  // Testing with all mocks defeats the purpose of integration testing
});
```

**Correct (testing real interactions):**

```typescript
test('user can create and retrieve a trip', async () => {
  // Arrange — use real service with test database
  const response = await request(app)
    .post('/api/trips')
    .send({ name: 'Tokyo Trip', startDate: '2026-04-01' });

  // Assert creation
  expect(response.status).toBe(201);

  // Assert retrieval
  const getResponse = await request(app).get(`/api/trips/${response.body.id}`);
  expect(getResponse.body.name).toBe('Tokyo Trip');
});
```

### Decision Guide

| What you're testing | Test type | Mock? |
|---|---|---|
| Pure function / calculation | Unit | No mocks needed |
| Component rendering | Unit | Mock data props, not the component |
| API call function | Unit | Mock the HTTP client |
| API endpoint | Integration | Real handler, mock external services only |
| Full user flow | Integration | Minimal mocking |
