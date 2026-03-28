---
title: Test Coverage
impact: MEDIUM
impactDescription: Focused coverage prevents regressions without test maintenance burden
tags: tdd, testing, coverage
---

## Test Coverage

**Impact: MEDIUM (Focused coverage prevents regressions without test maintenance burden)**

Coverage is a tool, not a goal. Prioritize meaningful coverage over hitting a number.

### What to Cover

**Always cover:**
- Business logic (calculations, validations, state transitions)
- Edge cases (empty input, boundary values, error states)
- Public API of each module (the interface others depend on)
- Bug fixes (write a regression test before fixing)

**Skip coverage for:**
- Framework boilerplate (config files, provider wrappers)
- Simple pass-through components with no logic
- Type definitions
- Generated code

### Coverage Priorities

**Incorrect (chasing 100% coverage with meaningless tests):**

```typescript
// Testing that a constant is a constant
test('API_URL is defined', () => {
  expect(API_URL).toBe('https://api.example.com');
});

// Testing framework behavior
test('component renders without crashing', () => {
  render(<App />);
});
```

**Correct (covering meaningful behavior):**

```typescript
// Testing business logic edge case
test('convert returns 0 when amount is 0', () => {
  expect(convert(0, 'USD', 'EUR', rates)).toBe(0);
});

// Testing error path
test('shows error message when API fetch fails', async () => {
  server.use(http.get('/api/rates', () => HttpResponse.error()));
  render(<CurrencyCalculator />);
  expect(await screen.findByRole('alert')).toHaveTextContent(/failed/i);
});
```

### Priority Order

1. **Critical path** — The main user workflow must be covered
2. **Error handling** — Every error state should have a test
3. **Edge cases** — Boundary values, empty states, invalid inputs
4. **Regression** — Every bug fix must include a test that reproduces the bug
