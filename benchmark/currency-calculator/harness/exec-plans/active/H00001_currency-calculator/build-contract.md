# Build Contract: currency-calculator

## Scope
Build a complete currency calculator web application following MVPVM + Domain-FSD architecture with 10 features as specified in the product spec.

## Completion Criteria
- [ ] App loads and displays currency converter UI
- [ ] Core conversion: enter amount, select source/target, see result in real-time (debounced)
- [ ] Swap button reverses currencies and recalculates
- [ ] Per-unit exchange rate displayed (e.g., "1 USD = 1,342.50 KRW")
- [ ] Currency selector with search (30+ currencies, searchable by name/code)
- [ ] Live rate fetching from public API with caching and staleness indicator
- [ ] Multi-currency comparison view (convert to multiple targets at once)
- [ ] Favorite currency pairs with local persistence
- [ ] Locale-aware amount formatting (decimal places, thousands separator)
- [ ] Historical rate indicator (up/down/stable vs previous day)
- [ ] Responsive layout (mobile + desktop, 375px breakpoint)
- [ ] Keyboard shortcuts (swap, focus, refresh)
- [ ] Error handling and offline resilience (cached rates when offline)
- [ ] Code follows MVPVM pattern (View purity, Presenter orchestration, ViewModel binding, Model purity)
- [ ] Code follows Domain-FSD structure (entities → features → widgets → use-cases)
- [ ] React handler naming convention (onX props, handleX functions)
- [ ] TDD: tests written before implementation, all passing
- [ ] Build succeeds with no errors

## Referenced Spec
- product-specs/currency-calculator.md

## Applicable Rules
- rules/pattern-mvpvm/
- rules/pattern-domain-fsd/
- rules/conv-react/

## Eval Criteria Files
- eval-criteria/functionality.md
- eval-criteria/code-quality.md
