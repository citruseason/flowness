---
name: tdd
description: Test-Driven Development process for the Generator agent. Guides RED-GREEN-REFACTOR cycle for each feature in the build contract. Internal skill — not user-invocable.
user-invocable: false
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# TDD (Test-Driven Development)

This skill defines the TDD process that the Generator agent follows when implementing features.

## References

Detailed guidance is available in the references/ directory:

- [Test Structure](references/test-structure.md) — AAA pattern, naming, organization
- [Unit vs Integration](references/unit-vs-integration.md) — when to use which test type
- [Coverage](references/coverage.md) — what to cover, what to skip, priority order
- [Mocking](references/mocking.md) — mock at boundaries, don't mock what you own

## Process

For each completion criterion in the build contract:

### Step 1: RED — Write a failing test

1. Read the completion criterion from build-contract.md
2. Translate it into one or more test cases
3. Follow test naming convention: describe the BEHAVIOR, not the implementation
   - Bad: `test('calls fetchRates')`
   - Good: `test('converts 100 USD to EUR using current exchange rate')`
4. Use AAA pattern: Arrange → Act → Assert (see [references/test-structure.md](references/test-structure.md))
5. Run the test → **must FAIL**
   - If it passes, the test is either wrong or the feature already exists
   - A test that never fails never proves anything

### Step 2: GREEN — Write minimal implementation

1. Write the minimum code needed to make the failing test pass
2. Do NOT add:
   - Extra error handling no test demands
   - Optimizations no test measures
   - Features no test covers
3. Run the test → **must PASS**
4. Run ALL existing tests → **must still PASS** (no regressions)

### Step 3: REFACTOR — Improve while green

1. Clean up the code:
   - Remove duplication
   - Improve naming
   - Extract functions if needed
   - Ensure ARCHITECTURE.md layer rules are followed
2. Run ALL tests after each change → **must stay GREEN**
3. If a test breaks during refactor → revert and try again

### Step 4: Repeat

Move to the next completion criterion. Repeat Steps 1-3.

## When to Choose Unit vs Integration Tests

Read [references/unit-vs-integration.md](references/unit-vs-integration.md) for details.

Quick decision:
- **Pure logic** (calculation, validation, transformation) → Unit test
- **API endpoint** (request → response) → Integration test
- **UI component** (render, interact) → Component test (unit-like)
- **Full user flow** (multi-step) → Integration test

## Mocking Rules

Read [references/mocking.md](references/mocking.md) for details.

Quick rules:
- Mock at system boundaries (HTTP, DB, filesystem, clock)
- Do NOT mock your own modules
- If you're mocking everything, write an integration test instead

## Bug Fix TDD

When fixing a bug found by the Evaluator or CodeReviewer:

1. Write a test that **reproduces the bug** (RED)
2. Fix the bug (GREEN)
3. Refactor if needed

This ensures the bug never regresses.

## Output Requirements

In build-result-r{N}.md, include:

```markdown
## TDD Summary
- Tests written: [N total]
- Tests passing: [N passing]
- RED-GREEN-REFACTOR cycles completed: [N]
```
