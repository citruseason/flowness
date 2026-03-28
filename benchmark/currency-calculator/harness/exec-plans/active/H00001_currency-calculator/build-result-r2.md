# Build Result

## Round: 2

## TDD Summary
- Tests written: 117 total (35 new, 82 carried over with updates)
- Tests passing: 117 passing
- RED-GREEN-REFACTOR cycles completed: 9

## What Was Implemented
This round addressed all 8 violations from code-review-r1.md. No new features were added; the focus was entirely on fixing architectural violations to comply with MVPVM + Domain-FSD rules.

### Violation Fixes

1. **[viewmodel-binding] ViewModel performs data fetching directly** -- Extracted rate-fetching logic from `useConverterVM` into a new Presenter-layer hook `useRateData` in `use-cases/`. The ViewModel now receives data from the Presenter and only transforms it for display.

2. **[model-purity] UI formatting functions in Model layer** -- Moved `formatAmount()` and `formatRate()` from `entities/currency/model/format.ts` to a new ViewModel-layer module `widgets/shared/formatting.ts`. Added `formatTrendDisplay()` and `formatLastUpdated()` there as well. Kept `parseAmountInput()` in entities (it is business validation, not UI formatting).

3. **[view-purity] View calls Model directly (CurrencySelectorWidget)** -- Added `selectedCurrency` to `useCurrencySelectorVM` return state. Updated the hook to accept `selectedCode` parameter and resolve the currency entity internally. Removed the direct `getCurrencyByCode` import from the View.

4. **[view-purity] View imports and filters Model data (ComparisonPanelWidget)** -- Added `availableCurrencies` to `useComparisonVM` return state, pre-computed in the ViewModel. Removed the `CURRENCIES` import and filter logic from the View.

5. **[view-purity] View performs data formatting (TrendIndicator)** -- Changed `TrendIndicator` props from `trend: TrendResult` to `direction` + `displayPercentage` (pre-formatted string). The ViewModel now computes `formatTrendDisplay()` and passes the result.

6. **[view-purity] View performs date formatting (RateStatus)** -- Changed `RateStatus` props from `lastUpdated: Date | null` to `lastUpdatedDisplay: string`. The ViewModel now computes the formatted time string via `formatLastUpdated()`.

7. **[view-purity] View imports from features (ShortcutHelp)** -- Changed `ShortcutHelp` to receive `shortcuts` as props instead of importing `SHORTCUTS` from the features layer. The ViewModel provides this data.

8. **[viewmodel-binding] ViewModel performs business logic (useComparisonVM)** -- Created `computeComparisons()` use-case function that orchestrates entity-layer `convert()` for multiple targets. The ViewModel now delegates conversion to this use-case and only formats results.

### Additional Improvements
- Moved keyboard shortcut registration (`useKeyboardShortcuts`) from the View into the ViewModel, along with the `amountInputRef`, so the View has zero imports from features/entities layers.
- All View files (in `**/ui/**/*.tsx`) now only import from their sibling ViewModel (`../model/`) or other widget Views -- zero direct entity/feature imports.

## Files Changed
- `src/domains/currency/use-cases/useRateData.ts` -- NEW: Presenter-layer hook for rate data fetching
- `src/domains/currency/use-cases/__tests__/useRateData.test.ts` -- NEW: 7 tests for useRateData
- `src/domains/currency/use-cases/useComparisonConversion.ts` -- NEW: Use-case for multi-currency comparison conversions
- `src/domains/currency/use-cases/__tests__/useComparisonConversion.test.ts` -- NEW: 7 tests for computeComparisons
- `src/domains/currency/widgets/shared/formatting.ts` -- NEW: ViewModel-layer formatting utilities
- `src/domains/currency/widgets/shared/__tests__/formatting.test.ts` -- NEW: 11 tests for formatting
- `src/domains/currency/entities/currency/model/format.ts` -- Removed formatAmount/formatRate, kept parseAmountInput only
- `src/domains/currency/entities/currency/model/__tests__/format.test.ts` -- Updated to only test parseAmountInput (5 tests)
- `src/domains/currency/widgets/converter/model/useConverterVM.ts` -- Refactored to use useRateData presenter, ViewModel formatting, shortcuts data, amountInputRef
- `src/domains/currency/widgets/converter/model/__tests__/useConverterVM.test.ts` -- Updated with 13 tests including new VM fields
- `src/domains/currency/widgets/converter/ui/ConverterWidget.tsx` -- Removed feature imports, uses VM for everything
- `src/domains/currency/widgets/converter/ui/TrendIndicator.tsx` -- Changed props to pre-formatted strings
- `src/domains/currency/widgets/converter/ui/__tests__/TrendIndicator.test.tsx` -- Updated for new props (4 tests)
- `src/domains/currency/widgets/converter/ui/RateStatus.tsx` -- Changed to accept lastUpdatedDisplay string
- `src/domains/currency/widgets/converter/ui/__tests__/RateStatus.test.tsx` -- Updated for new props (6 tests)
- `src/domains/currency/widgets/converter/ui/ShortcutHelp.tsx` -- Changed to accept shortcuts as props
- `src/domains/currency/widgets/converter/ui/__tests__/ShortcutHelp.test.tsx` -- NEW: 3 tests for ShortcutHelp
- `src/domains/currency/widgets/currency-selector/model/useCurrencySelectorVM.ts` -- Added selectedCode param and selectedCurrency output
- `src/domains/currency/widgets/currency-selector/model/__tests__/useCurrencySelectorVM.test.ts` -- NEW: 4 tests
- `src/domains/currency/widgets/currency-selector/ui/CurrencySelectorWidget.tsx` -- Removed getCurrencyByCode import
- `src/domains/currency/widgets/comparison-panel/model/useComparisonVM.ts` -- Delegates to use-case, provides availableCurrencies
- `src/domains/currency/widgets/comparison-panel/model/__tests__/useComparisonVM.test.ts` -- NEW: 4 tests
- `src/domains/currency/widgets/comparison-panel/ui/ComparisonPanelWidget.tsx` -- Removed CURRENCIES import

## Self-Check
- Build: pass (tsc -b and vite build both succeed)
- Tests: pass, 117 passing, 0 failing
- Rules checked: pattern-mvpvm (view-purity, presenter-orchestration, viewmodel-binding, model-purity), pattern-domain-fsd (layer-dependency, entity-isolation, feature-boundary, widget-composition), conv-react (handler-naming)

### Architecture Verification
- Zero View files (`**/ui/**/*.tsx`) import from entities or features layers
- Entities layer `format.ts` contains only `parseAmountInput` (business validation)
- All UI formatting lives in `widgets/shared/formatting.ts` (ViewModel layer)
- Data fetching is in `use-cases/useRateData.ts` (Presenter layer)
- Business logic orchestration is in `use-cases/useComparisonConversion.ts` (Presenter layer)
- ViewModels only transform Presenter data into display-ready strings
- Dependency direction: entities <- features <- widgets (use-cases can access all lower layers)

## Known Issues
- React "not wrapped in act(...)" warnings appear in useConverterVM tests. These are harmless warnings caused by async state updates in the useRateData hook firing during renderHook. They do not affect test correctness.

## Notes for CodeReviewer
- All 8 violations from code-review-r1.md have been addressed
- pattern-mvpvm/view-purity: All Views now render only ViewModel state, no direct entity/feature imports
- pattern-mvpvm/viewmodel-binding: ViewModel no longer fetches data (delegated to useRateData presenter)
- pattern-mvpvm/model-purity: formatAmount/formatRate moved from entities to ViewModel layer
- pattern-mvpvm/presenter-orchestration: useRateData handles fetching/caching orchestration only
- pattern-domain-fsd/layer-dependency: Dependency direction is strictly entities -> features -> widgets -> use-cases
- conv-react/handler-naming: All props use onX, all handlers use handleX

## Notes for Evaluator
- Run `npm run dev` to start the development server
- Run `npm test` to execute all tests (117 tests across 17 files)
- Run `npm run build` to verify production build
- The app functionality is unchanged from round 1 -- all features still work
- Key test commands: `npx vitest run` for all tests
