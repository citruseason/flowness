# TDD (Test-Driven Development)

## Overview
Generator follows TDD as its core development methodology. Tests are written BEFORE implementation to ensure every feature is verifiable, and to prevent implementation bias in test design.

## When to Apply
Always. Every feature implemented by the Generator must follow the RED-GREEN-REFACTOR cycle.

## Rules

| Rule | Impact | Description |
|------|--------|-------------|
| [RED-GREEN-REFACTOR](./red-green-refactor.md) | CRITICAL | The core TDD cycle — write failing test, implement to pass, refactor |
| [Test Structure](./test-structure.md) | HIGH | Arrange-Act-Assert pattern, test naming, organization |
| [Unit vs Integration](./unit-vs-integration.md) | HIGH | When to write unit tests vs integration tests |
| [Coverage](./coverage.md) | MEDIUM | Coverage expectations and what to prioritize |
| [Mocking](./mocking.md) | MEDIUM | When and how to mock — boundaries and strategies |
