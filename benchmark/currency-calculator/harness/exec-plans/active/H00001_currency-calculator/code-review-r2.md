# Code Review

## Round: 2
## Status: FAIL

## Rules Checked
- pattern-mvpvm: 4 detail rules checked (view-purity, presenter-orchestration, viewmodel-binding, model-purity)
- pattern-domain-fsd: 4 detail rules checked (layer-dependency, entity-isolation, feature-boundary, widget-composition)
- conv-react: 1 detail rule checked (handler-naming)

## Round 1 Regression Check
All 8 violations from round 1 have been addressed and do not regress:
1. ViewModel data fetching -- extracted to `useRateData` presenter. FIXED.
2. Model-layer formatting -- moved to `widgets/shared/formatting.ts`. FIXED.
3. View calls Model directly (CurrencySelectorWidget) -- `selectedCurrency` now from ViewModel. FIXED.
4. View imports Model data (ComparisonPanelWidget) -- `availableCurrencies` now from ViewModel. FIXED.
5. View performs data formatting (TrendIndicator) -- receives pre-formatted strings. FIXED.
6. View performs date formatting (RateStatus) -- receives `lastUpdatedDisplay` string. FIXED.
7. View imports from features (ShortcutHelp) -- receives `shortcuts` as props. FIXED.
8. ViewModel performs business logic (useComparisonVM) -- delegated to `computeComparisons` use-case. FIXED.

## Violations Found

### [pattern-mvpvm/viewmodel-binding] ViewModel performs business logic directly (conversion and trend calculation)
- File: `src/domains/currency/widgets/converter/model/useConverterVM.ts`
- Line: 84-93 and 96-109
- Found: The ViewModel imports `convert` and `calculateTrend` from the entities layer (line 2) and calls them directly: `convert(numericAmount, sourceCurrency, targetCurrency, ratePresenter.rateData.rates)` (line 89), `convert(1, sourceCurrency, targetCurrency, ...)` (lines 99-100), and `calculateTrend(currentResult.rate, historicalResult.rate)` (line 101). These are business logic functions -- currency conversion math and trend computation -- being executed inside the ViewModel. This is the same pattern that was correctly identified and fixed in `useComparisonVM` during round 2 (violation #8 from round 1), where `convert()` was moved into a use-case function `computeComparisons()`. The fix was not applied consistently to `useConverterVM`.
- Expected: ViewModel receives pre-computed conversion results and trend data from a Presenter or use-case layer and only transforms them into display-ready strings. Per the rule: "ViewModel은 Presenter로부터 받은 데이터를 View에 적합한 형태로 변환한다. 데이터 페칭, API 호출, 비즈니스 로직을 수행하지 않는다."
- Fix: Extend the `useRateData` presenter (or create a new use-case function) to compute the conversion result and trend, returning raw `ConversionResult` and `TrendResult` to the ViewModel. The ViewModel should only call `formatAmount()`, `formatRate()`, `formatTrendDisplay()`, and `formatLastUpdated()` on the pre-computed results. For example, add a `computeConversion(amount, source, target, rates)` and `computeTrend(source, target, currentRates, historicalRates)` to `use-cases/`, similar to how `computeComparisons()` was created.

### [pattern-mvpvm/presenter-orchestration] Presenter manages UI state (isLoading, error) directly
- File: `src/domains/currency/use-cases/useRateData.ts`
- Line: 21-24
- Found: The Presenter hook manages `isLoading` and `error` via `useState`: `const [isLoading, setIsLoading] = useState(true)` (line 23) and `const [error, setError] = useState<string | null>(null)` (line 24), with explicit `setIsLoading(true)` / `setIsLoading(false)` calls throughout the fetch lifecycle (lines 28, 44). The rule's Incorrect example shows exactly this pattern: `const [isLoading, setIsLoading] = useState(false)` in a Presenter function. The rule states: "UI 상태 관리(로딩, 포매팅, 가시성)는 ViewModel의 책임이다."
- Expected: The Presenter returns raw data and status, and the ViewModel derives `isLoading` and `error` display state. The Correct pattern in the rule uses `useSuspenseQuery()` which abstracts loading/error state. Without a query library, the Presenter should return a status union or raw fetch state, not manage boolean UI flags.
- Fix: Refactor `useRateData` to return a status-based result (e.g., `{ status: 'loading' | 'success' | 'error', data, error }`) or use a data-fetching abstraction. The ViewModel should then derive `isLoading: status === 'loading'` and `error` display strings. Alternatively, if adopting a query library (react-query/SWR) is in scope, the Presenter can delegate state tracking to it, matching the rule's Correct pattern.

## Clean Files
- `src/domains/currency/use-cases/useComparisonConversion.ts` -- use-case imports entities only, performs orchestration, no violations
- `src/domains/currency/widgets/shared/formatting.ts` -- ViewModel-layer formatting, imports only entity data helper, no violations
- `src/domains/currency/entities/currency/model/format.ts` -- contains only `parseAmountInput` (business validation), no violations
- `src/domains/currency/widgets/converter/ui/ConverterWidget.tsx` -- View renders ViewModel state only, no entity/feature imports, no violations
- `src/domains/currency/widgets/converter/ui/TrendIndicator.tsx` -- pure View, receives pre-formatted strings, no violations
- `src/domains/currency/widgets/converter/ui/RateStatus.tsx` -- pure View, receives pre-formatted strings, no violations
- `src/domains/currency/widgets/converter/ui/ShortcutHelp.tsx` -- pure View, receives shortcuts as props, local toggle state is acceptable, no violations
- `src/domains/currency/widgets/currency-selector/model/useCurrencySelectorVM.ts` -- ViewModel composes features/entities, provides selectedCurrency, no violations
- `src/domains/currency/widgets/currency-selector/ui/CurrencySelectorWidget.tsx` -- View renders ViewModel state only, no entity/feature imports, no violations
- `src/domains/currency/widgets/comparison-panel/model/useComparisonVM.ts` -- ViewModel delegates conversion to use-case, formats results, no violations
- `src/domains/currency/widgets/comparison-panel/ui/ComparisonPanelWidget.tsx` -- View renders ViewModel state only, no entity/feature imports, no violations
- `src/domains/currency/widgets/favorites-panel/ui/FavoritesPanelWidget.tsx` -- pure View, no violations
- `src/domains/currency/features/keyboard-shortcuts/model/shortcuts.ts` -- feature-layer hook, imports only React, no violations
- All `__tests__/` files -- test files not subject to architecture rules

## Summary

**2 violations total:**
- HIGH impact: 2 (1 viewmodel-binding business logic in useConverterVM, 1 presenter-orchestration UI state in useRateData)
- CRITICAL impact: 0
- MEDIUM impact: 0

**Key structural issues:**

1. **Inconsistent business logic extraction**: The `computeComparisons()` use-case was correctly created for `useComparisonVM`, but the same `convert()` and `calculateTrend()` calls remain directly in `useConverterVM`. The fix pattern is established -- apply it consistently by creating use-case functions for single-pair conversion and trend computation as well.

2. **Presenter manages UI loading state**: The `useRateData` presenter directly manages `isLoading`/`error` state via `useState`, which the rule identifies as a Presenter anti-pattern. The presenter should either return a status union or use a data-fetching abstraction that handles this implicitly.

**Actionable next steps:**
1. Extract `convert()` and `calculateTrend()` calls from `useConverterVM` into use-case layer functions (e.g., `computeConversion()` and `computeTrend()` in `use-cases/`). The ViewModel should receive pre-computed `ConversionResult` and `TrendResult` and only format them.
2. Refactor `useRateData` to avoid directly managing `isLoading`/`error` as boolean state. Either return a discriminated union (`{ status: 'loading' } | { status: 'success', data } | { status: 'error', error }`) or adopt a query abstraction.
