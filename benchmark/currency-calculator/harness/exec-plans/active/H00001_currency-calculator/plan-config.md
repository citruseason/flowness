# Plan Config: currency-calculator

## Topic
- Code: H00001
- Name: currency-calculator
- Spec: product-specs/currency-calculator.md

## Complexity Assessment
- Level: complex
- Reasoning: 10 features across full-stack (UI + Service + API integration), MVPVM + Domain-FSD architecture, offline resilience, locale formatting, keyboard shortcuts. Cross-cutting concerns.

## Dynamic Settings
- planner: completed
- eval_rounds: 3
- eval_tool: playwright

## Applicable Rules
- rules/pattern-mvpvm/
- rules/pattern-domain-fsd/
- rules/conv-react/

## Notes
- Architecture requires MVPVM + Domain-FSD layer separation
- CodeReviewer should verify View purity, layer dependency direction, handler naming
- Free exchange rate API (e.g., Frankfurter) — no API key needed
