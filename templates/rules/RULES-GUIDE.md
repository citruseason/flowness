# Rules Guide

## Folder Naming Convention

Rules are organized as folders under `harness/rules/` with a prefix that indicates the rule type:

| Prefix | Purpose | Scope | Examples |
|--------|---------|-------|----------|
| `conv-` | Naming and style conventions | Per language or framework | `conv-typescript/`, `conv-react/`, `conv-vue/` |
| `pattern-` | Architecture pattern rules | Per architectural pattern | `pattern-ddd/`, `pattern-mvpvm/`, `pattern-domain-fsd/` |
| `lib-` | Library/tool usage rules | Per library | `lib-zod/`, `lib-react-query/`, `lib-zustand/` |

## Folder Structure

Each rule is a folder containing:
```
{prefix}-{name}/
├── RULE.md              # Overview + rule table of contents
├── {detail-1}.md        # Individual rule with Incorrect/Correct examples
├── {detail-2}.md
└── ...
```

## Rule File Format

### RULE.md (main file)

```markdown
# {Rule Area Name}

## Overview
{Brief description and why it matters}

## When to Apply
{Situations where this rule area should be referenced}

## Rules

| Rule | Impact | Description |
|------|--------|-------------|
| [{title}](./{file}.md) | {CRITICAL/HIGH/MEDIUM/LOW} | {one-line} |
```

### Detail file (individual rule)

```markdown
---
title: Rule Title Here
impact: MEDIUM
impactDescription: Optional description of impact
tags: tag1, tag2
---

## Rule Title Here

**Impact: MEDIUM (optional impact description)**

Brief explanation of the rule and why it matters.

**Incorrect (description of what's wrong):**

\```typescript
// Bad code example
\```

**Correct (description of what's right):**

\```typescript
// Good code example
\```
```

## Key Principles

- Rules must be **generic** — no hardcoded file paths. Reference ARCHITECTURE.md for project-specific structure.
- Each rule must include **Incorrect/Correct code examples** so Generator can apply them immediately and CodeReviewer can detect violations.
- Rules are consumed by:
  - **Generator** — reads relevant rules before implementation
  - **CodeReviewer** — checks code against rules after implementation
  - **/maintain** — periodically checks entire codebase against all applicable rules
- Applicable rules per topic are determined in `/plan` and recorded in `plan-config.md`, then carried into `build-contract.md`.
- `/maintain` determines applicability by checking ARCHITECTURE.md tech stack + project dependencies.

## When to Add a New Rule

- A pattern or convention is violated repeatedly
- A new library/framework is added to the project
- A human taste preference needs to be enforced consistently
- An Evaluator keeps flagging the same issue across topics
