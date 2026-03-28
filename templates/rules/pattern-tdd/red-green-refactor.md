---
title: RED-GREEN-REFACTOR Cycle
impact: CRITICAL
impactDescription: Core TDD methodology — ensures every line of code is driven by a test
tags: tdd, testing, methodology
---

## RED-GREEN-REFACTOR Cycle

**Impact: CRITICAL (Core TDD methodology)**

Every feature must go through three phases. Never skip a phase.

### RED — Write a failing test

Write a test that describes the expected behavior. Run it to confirm it FAILS. A test that passes immediately is either testing the wrong thing or the feature already exists.

**Incorrect (implementation before test):**

```typescript
// 1. Write the function first
function add(a: number, b: number) {
  return a + b;
}

// 2. Then write a test that passes immediately
test('add', () => {
  expect(add(1, 2)).toBe(3); // passes — but did the test drive the implementation?
});
```

**Correct (test before implementation):**

```typescript
// 1. Write the test first — it FAILS because add() doesn't exist
test('adds two numbers', () => {
  expect(add(1, 2)).toBe(3);
});

// 2. Run test → RED (fails: add is not defined)

// 3. Write minimal implementation
function add(a: number, b: number) {
  return a + b;
}

// 4. Run test → GREEN (passes)
```

### GREEN — Write minimal code to pass

Implement only enough code to make the failing test pass. Do not add extra functionality, error handling, or optimizations that no test demands yet.

**Incorrect (over-implementation in GREEN phase):**

```typescript
// Test only requires basic addition
test('adds two numbers', () => {
  expect(add(1, 2)).toBe(3);
});

// But implementation adds validation, logging, caching...
function add(a: number, b: number) {
  if (typeof a !== 'number') throw new TypeError('a must be number');
  if (typeof b !== 'number') throw new TypeError('b must be number');
  console.log(`Adding ${a} + ${b}`);
  return a + b;
}
```

**Correct (minimal implementation):**

```typescript
function add(a: number, b: number) {
  return a + b;
}
```

### REFACTOR — Improve while tests stay green

After GREEN, clean up the code. Extract duplication, improve naming, organize structure. Run tests after every change to ensure nothing breaks.

The key constraint: tests must stay GREEN throughout refactoring. If a test breaks during refactor, you introduced a regression — revert and try again.
