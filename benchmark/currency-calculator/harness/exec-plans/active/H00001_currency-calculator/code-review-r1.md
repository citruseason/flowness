# Code Review

## Round: 1
## Status: FAIL

## Rules Checked
- pattern-mvpvm: 4 detail rules checked (view-purity, presenter-orchestration, viewmodel-binding, model-purity)
- pattern-domain-fsd: 4 detail rules checked (layer-dependency, entity-isolation, feature-boundary, widget-composition)
- conv-react: 1 detail rule checked (handler-naming)

## Violations Found

### [pattern-mvpvm/viewmodel-binding] ViewModel performs data fetching directly
- File: `src/domains/currency/widgets/converter/model/useConverterVM.ts`
- Line: 41-61
- Found: ViewModel calls `fetchLatestRates('EUR')` and `fetchHistoricalRates('EUR', ...)` inside a `useCallback`/`useEffect` cycle, performing network API calls directly from the ViewModel layer.
- Expected: ViewModel receives data from a Presenter (or use-case) layer and only transforms it for the View. Data fetching belongs in the Presenter or use-case layer.
- Fix: Extract the rate-fetching logic (lines 41-65) into a Presenter-layer hook (e.g., `src/domains/currency/features/rate-fetching/model/useRateFetching.ts` or `src/domains/currency/use-cases/useRateData.ts`) that returns `{ rateData, historicalRateData, isLoading, error, refresh }`. The ViewModel should receive this data as input and only compute `convertedDisplay`, `rateDisplay`, `trend`, etc.

### [pattern-mvpvm/model-purity] UI formatting functions placed in Model (entities) layer
- File: `src/domains/currency/entities/currency/model/format.ts`
- Line: 6-35
- Found: `formatAmount()` returns locale-formatted currency strings (e.g., "$1,342.50") and `formatRate()` returns display strings like `"1 USD = 1,342.50 KRW"`. These produce UI presentation text. The rule Incorrect example shows `display: \`${result.toFixed(2)} ${to}\`` in Model as a violation; `formatRate` does the same pattern: `` `1 ${from} = ${formattedRate} ${to}` ``.
- Expected: Model contains only pure business logic (conversion math, lookups, validation). UI formatting belongs in the ViewModel layer.
- Fix: Move `formatAmount()` and `formatRate()` to the ViewModel layer (e.g., into `useConverterVM.ts` or a shared ViewModel utility under `widgets/`). Keep `parseAmountInput()` in the entity layer since input parsing is business validation, not UI formatting. Alternatively, if reuse across multiple ViewModels is needed, create a shared formatting module under `widgets/shared/` or a ViewModel utility.

### [pattern-mvpvm/view-purity] View calls Model directly, bypassing ViewModel
- File: `src/domains/currency/widgets/currency-selector/ui/CurrencySelectorWidget.tsx`
- Line: 3, 18
- Found: View imports `getCurrencyByCode` from entities layer and calls it directly: `const selected = getCurrencyByCode(selectedCode);`. The View is reading from the Model layer instead of consuming pre-computed ViewModel state.
- Expected: View only renders state from the ViewModel. The selected currency's display data (`flag`, `name`) should be provided by `useCurrencySelectorVM`.
- Fix: Add `selectedCurrency: Currency | undefined` (or its display fields) to `CurrencySelectorVMState` and compute it in `useCurrencySelectorVM`. Remove the direct entity import from the View file.

### [pattern-mvpvm/view-purity] View imports and filters Model data directly
- File: `src/domains/currency/widgets/comparison-panel/ui/ComparisonPanelWidget.tsx`
- Line: 2, 32-35
- Found: View imports `CURRENCIES` from entities layer and performs filtering logic: `CURRENCIES.filter(c => !vm.comparisonCodes.includes(c.code) && c.code !== sourceCurrency)`. This is data computation in the View.
- Expected: View only renders ViewModel state. The list of available currencies to add should be pre-computed in the ViewModel.
- Fix: Add `availableCurrencies: Currency[]` (or a simpler display type) to `ComparisonVMState`, computed in `useComparisonVM`. Remove the `CURRENCIES` import and filter logic from the View.

### [pattern-mvpvm/view-purity] View performs data formatting
- File: `src/domains/currency/widgets/converter/ui/TrendIndicator.tsx`
- Line: 19
- Found: View performs numeric formatting: `{Math.abs(trend.percentageChange).toFixed(2)}%`. This is a data transformation that should be pre-computed.
- Expected: View renders pre-formatted display strings from the ViewModel.
- Fix: Add a `trendDisplay` string (e.g., `"0.45%"`) to the ViewModel's trend output, computed in `useConverterVM`. The View should render `{trend.display}` or receive it as a pre-formatted prop.

### [pattern-mvpvm/view-purity] View performs date formatting
- File: `src/domains/currency/widgets/converter/ui/RateStatus.tsx`
- Line: 20
- Found: View calls `lastUpdated.toLocaleTimeString()` to format a Date object into a display string. This is a data transformation in the View.
- Expected: View receives a pre-formatted string from the ViewModel.
- Fix: Change `lastUpdated` in `ConverterVMState` from `Date | null` to a pre-formatted string (e.g., `lastUpdatedDisplay: string`), computed in `useConverterVM` using `new Date(rateData.timestamp).toLocaleTimeString()`. The View should render the string directly.

### [pattern-mvpvm/view-purity] View imports data directly from features layer
- File: `src/domains/currency/widgets/converter/ui/ShortcutHelp.tsx`
- Line: 2
- Found: View imports `SHORTCUTS` from `features/keyboard-shortcuts/model/shortcuts` and iterates over it to render the list. The View is reaching into the features layer directly instead of consuming ViewModel state.
- Expected: View only renders data provided by a ViewModel.
- Fix: Either pass `SHORTCUTS` data through a ViewModel hook (e.g., a `useShortcutHelpVM` that returns `{ shortcuts, isOpen, handleToggle }`), or pass it as a prop from the parent ConverterWidget which already has access to the keyboard shortcuts feature.

### [pattern-mvpvm/viewmodel-binding] ViewModel performs business logic (conversion calculation)
- File: `src/domains/currency/widgets/comparison-panel/model/useComparisonVM.ts`
- Line: 7-8, 50
- Found: ViewModel imports `convert` from entities and calls it directly (`convert(numericAmount, sourceCurrency, code, rates)`) to perform currency conversion math. The rule states ViewModel must not perform business logic.
- Expected: ViewModel receives pre-computed conversion results from a Presenter or use-case layer and only transforms them into display-ready state.
- Fix: Create a Presenter-layer function or use-case that computes the comparison conversions, then have the ViewModel receive the results and only format them for display.

## Clean Files
- `src/domains/currency/entities/currency/model/types.ts` -- pure types, no violations
- `src/domains/currency/entities/currency/model/currencies.ts` -- pure data and lookup, no violations
- `src/domains/currency/entities/rate/model/convert.ts` -- pure business logic, no violations
- `src/domains/currency/entities/rate/api/rateApi.ts` -- data source in entities/api, appropriate location
- `src/domains/currency/features/search/model/searchCurrencies.ts` -- proper entity-only imports, no violations
- `src/domains/currency/features/favorites/model/favorites.ts` -- proper entity-only imports, no violations
- `src/domains/currency/features/comparison/model/comparison.ts` -- standalone feature, no violations
- `src/domains/currency/features/keyboard-shortcuts/model/shortcuts.ts` -- proper orchestration hook, no violations
- `src/domains/currency/widgets/favorites-panel/ui/FavoritesPanelWidget.tsx` -- renders ViewModel state only, no violations
- `src/domains/currency/widgets/favorites-panel/model/useFavoritesVM.ts` -- composes features, acceptable
- `src/app/App.tsx` -- pure composition, no violations
- `src/main.tsx` -- entry point, no violations
- All `__tests__/` files -- test files not subject to architecture rules

## Summary

**8 violations total:**
- CRITICAL impact: 5 (1 viewmodel-binding data fetching, 4 view-purity violations)
- HIGH impact: 3 (1 model-purity formatting in entities, 1 viewmodel-binding business logic, 1 view-purity Model bypass)
- MEDIUM impact: 0

**Key structural issues:**

1. **Missing Presenter layer**: The ConverterVM acts as both Presenter and ViewModel -- it fetches data, orchestrates API calls, AND transforms data for display. Split it into a Presenter hook (data fetching + orchestration) and a ViewModel hook (UI state transformation).

2. **Formatting functions misplaced**: `formatAmount` and `formatRate` in `entities/` produce display strings, violating Model purity. Move them to the ViewModel layer.

3. **Views reach into Model/Feature layers**: Several Views import directly from `entities/` or `features/` instead of consuming ViewModel state exclusively. All data and logic should flow through the ViewModel.

**Actionable next steps:**
1. Extract data-fetching from `useConverterVM` into a Presenter-layer hook
2. Move `formatAmount`/`formatRate` from entities to ViewModel layer
3. Remove direct entity/feature imports from all View files -- route data through ViewModels
4. Pre-compute all display strings (trend percentage, timestamps) in ViewModels
