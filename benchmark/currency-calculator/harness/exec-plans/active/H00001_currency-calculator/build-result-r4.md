# Build Result

## Round: 4

## TDD Summary
- Tests written: 162 total (25 new in this round)
- Tests passing: 162 passing
- RED-GREEN-REFACTOR cycles completed: 6

## What Was Implemented

All 7 code review violations from round 4 have been addressed:

### 1. [lib-zod/schema-single-source-of-truth] Zod schemas for all entity types
- Created `entities/currency/model/schema.ts` with `currencySchema`, `exchangeRateSchema`, `conversionSchema`, `rateTrendSchema`, `favoritePairSchema`
- Created `entities/rate/model/schema.ts` with `conversionResultSchema`, `trendResultSchema`, `rateDataSchema`, `frankfurterResponseSchema`
- All TypeScript types are now derived via `z.infer<typeof schema>`
- Old `types.ts` re-exports from schema for backward compatibility
- Old inline interfaces in `convert.ts` replaced with re-exports from schema

### 2. [lib-zod/api-response-validation] API response validation at fetch boundary
- `fetchLatestRates` and `fetchHistoricalRates` now parse API responses through `frankfurterResponseSchema.parse(json)` before constructing the return value
- `RateCache.get()` now validates localStorage data through `rateDataSchema.parse()` -- corrupt or wrong-shape data returns `null`
- `RateData` interface moved from API file to `entities/rate/model/schema.ts` (model layer) as a Zod-derived type

### 3. [pattern-mvpvm/presenter-orchestration] Presenter returns raw data only
- `useRateData` no longer returns `errorMessage` (formatted string) or `isStale` (UI state)
- Returns `fetchError: Error | null` (raw Error object) instead of `errorMessage: string | null`
- Status discriminator `status: 'loading' | 'success' | 'error'` is retained as a valid raw data shape

### 4. [pattern-mvpvm/viewmodel-binding] ViewModel receives data as parameter
- `useConverterVM` now accepts `RateDataState` as a parameter instead of calling `useRateData()` internally
- ConverterWidget (View) calls `useRateData()` and passes the result to `useConverterVM(presenterState)`
- ViewModel derives `isLoading`, `error` display string, and `isStale` from the raw presenter data

### 5. [conv-react/handler-naming] Single handler for favorite pair selection
- Added `handleSelectFavoritePair(source, target)` to `useConverterVM`
- ConverterWidget passes `vm.handleSelectFavoritePair` to `FavoritesPanelWidget.onSelectPair` instead of inline anonymous handler

### 6. [pattern-mvpvm/view-purity] CurrencySelectorWidget View purified
- Moved `useEffect` for focus-on-open from View to ViewModel (manages `searchInputRef` internally)
- Moved `useEffect` for click-outside-close from View to ViewModel (manages `dropdownRef` internally)
- Moved `getFlagEmoji()` utility from View to ViewModel
- ViewModel now provides `dropdownRef`, `searchInputRef`, `selectedFlagEmoji`, and `getFlagEmoji` function
- View has zero `useEffect` hooks, zero utility functions -- pure rendering only

### 7. [pattern-domain-fsd/entity-isolation] ConversionResult and TrendResult schemas
- Created Zod schemas for both types in `entities/rate/model/schema.ts`
- `convert.ts` re-exports types from schema module

## Files Changed
- `src/domains/currency/entities/currency/model/schema.ts` - NEW: Zod schemas for Currency, ExchangeRate, Conversion, RateTrend, FavoritePair
- `src/domains/currency/entities/currency/model/types.ts` - CHANGED: Now re-exports types from schema.ts
- `src/domains/currency/entities/rate/model/schema.ts` - NEW: Zod schemas for ConversionResult, TrendResult, RateData, FrankfurterResponse
- `src/domains/currency/entities/rate/model/convert.ts` - CHANGED: Re-exports types from schema instead of inline interfaces
- `src/domains/currency/entities/rate/api/rateApi.ts` - CHANGED: Imports RateData from model schema, validates API responses and cache with Zod
- `src/domains/currency/use-cases/useRateData.ts` - CHANGED: Returns raw Error as fetchError, removed errorMessage and isStale
- `src/domains/currency/widgets/converter/model/useConverterVM.ts` - CHANGED: Accepts RateDataState param, derives isStale/error/isLoading, added handleSelectFavoritePair
- `src/domains/currency/widgets/converter/ui/ConverterWidget.tsx` - CHANGED: Calls useRateData, passes to useConverterVM, uses handleSelectFavoritePair
- `src/domains/currency/widgets/currency-selector/model/useCurrencySelectorVM.ts` - CHANGED: Added refs, useEffects, getFlagEmoji, selectedFlagEmoji
- `src/domains/currency/widgets/currency-selector/ui/CurrencySelectorWidget.tsx` - CHANGED: Pure View, no useEffect/utility functions
- `src/domains/currency/entities/currency/model/__tests__/schema.test.ts` - NEW: 9 tests for currency entity schemas
- `src/domains/currency/entities/rate/model/__tests__/schema.test.ts` - NEW: 8 tests for rate entity schemas
- `src/domains/currency/entities/rate/api/__tests__/apiValidation.test.ts` - NEW: 5 tests for API response validation
- `src/domains/currency/use-cases/__tests__/useRateData.test.ts` - CHANGED: Tests for raw Error return, no UI state exposure
- `src/domains/currency/widgets/converter/model/__tests__/useConverterVM.test.ts` - CHANGED: Tests pass RateDataState as param, test handleSelectFavoritePair
- `src/domains/currency/widgets/currency-selector/model/__tests__/useCurrencySelectorVM.test.ts` - CHANGED: Tests for refs, selectedFlagEmoji, getFlagEmoji
- `package.json` - CHANGED: Added zod dependency

## Self-Check
- Build: pass (tsc -b and vite build both succeed)
- Tests: pass, 162 passing, 0 failing
- Rules checked: lib-zod (schema-single-source-of-truth, api-response-validation), pattern-mvpvm (presenter-orchestration, viewmodel-binding, view-purity), conv-react (handler-naming), pattern-domain-fsd (entity-isolation, layer-dependency)

## Known Issues
- The `useRateData` test for "does not expose isLoading, error, isStale, or errorMessage" generates React act() warnings in test output. These are non-blocking -- they occur because the hook triggers async state updates that resolve after the synchronous test assertion. The test still passes correctly.
- `ComparisonConversionResult` in `use-cases/useComparisonConversion.ts` remains a standalone interface (not Zod-derived). The code review noted this as lower priority since it is a use-case composition type, not an entity type.

## Notes for CodeReviewer
- All 7 violations from code-review-r4.md have been fixed
- lib-zod/schema-single-source-of-truth: All entity types now derived from Zod schemas via z.infer
- lib-zod/api-response-validation: All API responses validated with schema.parse(); RateCache validates localStorage data
- pattern-mvpvm/presenter-orchestration: useRateData returns raw Error, no UI state
- pattern-mvpvm/viewmodel-binding: useConverterVM accepts RateDataState as parameter; View wires Presenter to ViewModel
- conv-react/handler-naming: handleSelectFavoritePair added to ViewModel; no inline handlers in View
- pattern-mvpvm/view-purity: CurrencySelectorWidget is now pure (no useEffect, no utility functions)
- pattern-domain-fsd/entity-isolation: ConversionResult and TrendResult derived from Zod schemas
- The "[pattern-domain-fsd/layer-dependency] widgets/shared/ imports entities" item was marked CLEAN in the review (no violation)

## Notes for Evaluator
- Run `npm test` (or `npx vitest run`) to verify all 162 tests pass
- Run `npm run build` to verify TypeScript and Vite build succeed
- Run `npm run dev` to start the development server and test the UI
- The app uses Frankfurter API (https://api.frankfurter.app) for live rates
- Zod was added as a new dependency in this round
- All functional behavior remains identical -- this round focused entirely on architectural rule compliance
