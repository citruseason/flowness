# Code Review

## Round: 4
## Status: FAIL

## Rules Checked
- pattern-mvpvm: 4 detail rules checked (view-purity, presenter-orchestration, viewmodel-binding, model-purity)
- pattern-domain-fsd: 4 detail rules checked (layer-dependency, entity-isolation, feature-boundary, widget-composition)
- conv-react: 1 detail rule checked (handler-naming)
- lib-zod: 4 detail rules checked (schema-single-source-of-truth, api-response-validation, form-schema-derivation, entity-schema-purity)
- lib-react-query: 6 detail rules checked (query-options-factory, suspense-query-usage, ssr-prefetch-pattern, mutation-placement, query-key-conventions, viewmodel-query-boundary)
- lib-zustand: 5 detail rules checked (store-placement, client-state-only, react-query-integration, forbidden-layers, local-state-preference)
- lib-react-hook-form: 5 detail rules checked (form-hook-in-features, view-consumes-form-hook, zod-resolver-derived-schema, client-only-form-validation, edit-form-server-defaults)
- conv-nextjs: 7 detail rules checked (server-client-boundary, page-server-component, streaming-ssr-strategy, suspense-boundary-placement, loading-vs-suspense, error-boundary, generate-metadata)

## Violations Found

### [lib-zod/schema-single-source-of-truth] Schema as Single Source of Truth
- File: `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/entities/currency/model/types.ts`
- Line: 1-37
- Found: Five standalone interfaces (`Currency`, `ExchangeRate`, `Conversion`, `RateTrend`, `FavoritePair`) defined without Zod schemas. No `z.infer<typeof schema>` pattern anywhere in the project.
- Expected: Each entity type must be inferred from a Zod schema using `z.infer<typeof schema>`. Schemas belong in `entities/*/model/` files.
- Fix: Create Zod schemas (e.g., `currencySchema`, `exchangeRateSchema`, `conversionSchema`, `rateTrendSchema`, `favoritePairSchema`) in `entities/currency/model/schema.ts` and derive all types via `z.infer`. Remove the standalone interfaces from `types.ts`. Example:
  ```typescript
  // entities/currency/model/schema.ts
  import { z } from "zod";
  export const currencySchema = z.object({
    code: z.string().length(3),
    name: z.string().min(1),
    symbol: z.string().min(1),
    flag: z.string().min(2),
  });
  export type Currency = z.infer<typeof currencySchema>;
  ```

### [lib-zod/api-response-validation] API Response Validation
- File: `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/entities/rate/api/rateApi.ts`
- Line: 11-23 and 25-40
- Found: `fetchLatestRates` and `fetchHistoricalRates` cast `data` from `response.json()` to a manually constructed object without any Zod `schema.parse()` call. The response shape is trusted blindly.
- Expected: Every API response must be parsed through its corresponding Zod entity schema at the fetch boundary using `schema.parse(json)`.
- Fix: Define a `rateDataSchema` in `entities/rate/model/schema.ts` (or alongside the existing model files) and call `rateDataSchema.parse(data)` on the JSON response before returning. Example:
  ```typescript
  const json = await response.json();
  const parsed = rateResponseSchema.parse(json);
  return { base: parsed.base, date: parsed.date, rates: { [parsed.base]: 1, ...parsed.rates }, timestamp: Date.now() };
  ```

### [lib-zod/api-response-validation] API Response Validation -- RateData interface in API layer
- File: `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/entities/rate/api/rateApi.ts`
- Line: 4-9
- Found: A standalone `RateData` interface defined directly in the API file. This is a domain type that should be inferred from a Zod schema.
- Expected: Domain types are inferred from Zod schemas in the Model layer (`entities/*/model/`).
- Fix: Move this type to a Zod schema in `entities/rate/model/schema.ts` and import it. The API file should import the type from the model layer.

### [lib-zod/api-response-validation] API Response Validation -- RateCache.get()
- File: `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/entities/rate/api/rateApi.ts`
- Line: 57-65
- Found: `RateCache.get()` reads from localStorage and casts with `as RateData` without runtime validation. Corrupt or tampered localStorage data would silently pass through.
- Expected: Parse stored JSON through the schema before returning it.
- Fix: Add `rateDataSchema.parse(JSON.parse(raw))` in the `get()` method (catching `ZodError` and returning `null` on failure).

### [pattern-mvpvm/presenter-orchestration] Presenter Orchestration Only
- File: `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/use-cases/useRateData.ts`
- Line: 24-63
- Found: The Presenter hook `useRateData` manages UI state (`status: 'loading' | 'success' | 'error'`, `errorMessage`, `isStale`) via `useState`. These are UI state derivations that belong in the ViewModel. The Presenter should only orchestrate data fetching and return raw data.
- Expected: Presenter returns raw data and a status discriminator. ViewModel derives `isLoading`, `error` display strings, and `isStale` booleans.
- Fix: Simplify `useRateData` to return `{ rateData, historicalRateData, refresh, fetchError }` where `fetchError` is the raw Error or null. Move the `status`, `errorMessage`, and `isStale` derivations into `useConverterVM` (the ViewModel). Alternatively, since this is a Vite SPA without React Query, the hook can return a simple loading/data/error discriminated union, but the formatted `errorMessage` string is a ViewModel concern and should not be computed here.

### [pattern-mvpvm/viewmodel-binding] ViewModel Binding Only -- ViewModel calls use-case hooks directly
- File: `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/widgets/converter/model/useConverterVM.ts`
- Line: 48
- Found: The ViewModel `useConverterVM` calls `useRateData()` directly, which is a use-case hook that performs data fetching via `useState`/`useEffect`/`fetch`. While the ViewModel correctly delegates the actual fetching to the use-case, it still directly invokes a data-fetching hook. Per the viewmodel-binding rule, ViewModels should receive data from Presenter hooks rather than call them -- the ViewModel's role is UI state transformation only.
- Expected: ViewModel receives already-fetched data as parameters or from a parent component/hook composition point. The ViewModel should not be the caller of data-fetching hooks.
- Fix: The ConverterWidget (View) or a parent composition point should call `useRateData()` and pass the results into `useConverterVM(rateData)` as parameters. This aligns with the MVPVM pattern where the View wires Presenter to ViewModel.

### [pattern-domain-fsd/entity-isolation] Entity Isolation -- ConversionResult and TrendResult in rate model
- File: `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/entities/rate/model/convert.ts`
- Line: 1-11
- Found: `ConversionResult` and `TrendResult` are standalone interfaces without Zod schemas (also a lib-zod/schema-single-source-of-truth violation). While the entity isolation pattern is correctly followed (no cross-entity imports), these types should be Zod-schema-derived as well.
- Expected: Entity types inferred from Zod schemas.
- Fix: Create `conversionResultSchema` and `trendResultSchema` in the model layer and infer types from them.

### [pattern-domain-fsd/layer-dependency] Layer Dependency Direction -- widgets/shared/ imports entities
- File: `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/widgets/shared/formatting.ts`
- Line: 1
- Found: `import { getDecimalPlaces } from '../../entities/currency/model/currencies'` -- a widget-layer file imports from entities. This is technically allowed by the layer-dependency rule (widgets can import entities). No violation here on review. This is CLEAN.

### [conv-react/handler-naming] Handler Naming Convention
- File: `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/widgets/converter/ui/ConverterWidget.tsx`
- Line: 20-23
- Found: Inline anonymous handler `onSelectPair={(source, target) => { vm.handleSourceChange(source); vm.handleTargetChange(target); }}` -- while not strictly a naming violation, this creates an inline handler in the View that orchestrates two ViewModel calls. This is borderline business logic in the View (combining two actions).
- Expected: The View should call a single ViewModel method. The composition of two actions should be in the ViewModel.
- Fix: Add a `handleSelectFavoritePair(source, target)` method to `useConverterVM` that calls both `handleSourceChange` and `handleTargetChange` internally. Then pass `vm.handleSelectFavoritePair` to `onSelectPair`.

### [pattern-mvpvm/view-purity] View Purity -- CurrencySelectorWidget contains UI behavior logic
- File: `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/widgets/currency-selector/ui/CurrencySelectorWidget.tsx`
- Line: 17-37
- Found: Two `useEffect` hooks in the View component: one for focusing the search input (`useEffect` with `searchInputRef.current.focus()`), and one for handling outside-click-to-close (`useEffect` with `document.addEventListener('mousedown', ...)`). These are UI behavior logic within a View component.
- Expected: View components should be pure renderers. UI behaviors like focus management and click-outside detection should be encapsulated in the ViewModel or dedicated hooks within the widget's model layer.
- Fix: Move the focus-on-open logic and outside-click-close logic into `useCurrencySelectorVM`. The ViewModel can accept a ref parameter or return a `dropdownRef` and manage the side effects internally. The View should only render and bind.

### [pattern-mvpvm/view-purity] View Purity -- CurrencySelectorWidget contains utility function
- File: `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/widgets/currency-selector/ui/CurrencySelectorWidget.tsx`
- Line: 114-123
- Found: `getFlagEmoji()` utility function defined in the View file. This is a data transformation function (converting country code to flag emoji) that belongs in the ViewModel or a shared utility.
- Expected: View files should contain only the component and its props interface. Transformation functions belong in the ViewModel layer.
- Fix: Move `getFlagEmoji` to the `useCurrencySelectorVM` ViewModel or to `widgets/shared/formatting.ts`. The ViewModel should provide pre-formatted flag emojis in its return value, or the function should be in a shared utility file.

### [lib-zod/schema-single-source-of-truth] Schema as Single Source of Truth -- ComparisonConversionResult
- File: `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/use-cases/useComparisonConversion.ts`
- Line: 4-9
- Found: Standalone `ComparisonConversionResult` interface defined in a use-case without a Zod schema.
- Expected: Domain types should be inferred from Zod schemas.
- Fix: If this is a use-case-specific composition type, it can remain as a TypeScript interface (it is not an entity type). However, since it closely mirrors entity data, consider deriving it from entity schemas. Lower priority than entity-layer violations.

## Clean Files
- `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/app/App.tsx` -- Pure composition, no violations
- `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/main.tsx` -- Entry point, no violations
- `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/entities/currency/model/currencies.ts` -- Clean entity data, properly isolated
- `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/entities/currency/model/format.ts` -- Pure business logic in Model layer
- `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/entities/rate/model/convert.ts` -- Pure business logic (Zod schema violation noted separately)
- `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/features/comparison/model/comparison.ts` -- Clean feature, imports only entities
- `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/features/favorites/model/favorites.ts` -- Clean feature, imports only entities
- `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/features/keyboard-shortcuts/model/shortcuts.ts` -- Clean feature hook
- `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/features/search/model/searchCurrencies.ts` -- Clean feature, imports only entities
- `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/use-cases/computeConversion.ts` -- Clean use-case orchestration
- `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/use-cases/useComparisonConversion.ts` -- Clean use-case orchestration
- `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/widgets/shared/formatting.ts` -- Clean ViewModel-layer formatting
- `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/widgets/converter/ui/TrendIndicator.tsx` -- Pure View component
- `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/widgets/converter/ui/RateStatus.tsx` -- Pure View component
- `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/widgets/converter/ui/ShortcutHelp.tsx` -- Pure View with acceptable local useState
- `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/widgets/comparison-panel/model/useComparisonVM.ts` -- Clean ViewModel
- `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/widgets/comparison-panel/ui/ComparisonPanelWidget.tsx` -- Pure View component
- `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/widgets/favorites-panel/model/useFavoritesVM.ts` -- Clean ViewModel
- `/Users/user/projects/personal/flow-v2/benchmark/currency-calculator/src/domains/currency/widgets/favorites-panel/ui/FavoritesPanelWidget.tsx` -- Pure View component

## Non-Applicable Rules (no violations possible)
- **lib-react-query** (all 6 rules): The project does not use React Query / TanStack Query. It uses raw `fetch` + `useState`/`useEffect` for data fetching. These rules are not applicable to the current codebase. If React Query is adopted in the future, all 6 rules become applicable.
- **lib-zustand** (all 5 rules): The project does not use Zustand. State management uses React's built-in `useState`. These rules are not applicable.
- **lib-react-hook-form** (all 5 rules): The project does not use React Hook Form. No forms with `useForm` exist. These rules are not applicable.
- **conv-nextjs** (all 7 rules): The project uses Vite (not Next.js). There is no `app/` directory with `page.tsx`, `layout.tsx`, etc. These rules are not applicable.

## Summary

**Violations by severity:**
- CRITICAL: 2 (lib-zod/schema-single-source-of-truth x1 covering 5 interfaces, lib-zod/api-response-validation x1 covering 2 fetch functions + cache)
- HIGH: 2 (pattern-mvpvm/presenter-orchestration x1, pattern-mvpvm/viewmodel-binding x1)
- MEDIUM: 3 (conv-react/handler-naming x1, pattern-mvpvm/view-purity x2)

**Key findings:**
1. The most pervasive issue is the absence of Zod schemas. All entity types are standalone TypeScript interfaces with no runtime validation. This is a CRITICAL violation that affects `types.ts`, `convert.ts`, and `rateApi.ts`.
2. API responses from Frankfurter are not validated at the fetch boundary -- the app trusts server responses and localStorage data blindly.
3. The Presenter hook `useRateData` manages UI state (status strings, error messages) that should be the ViewModel's responsibility.
4. The ConverterWidget View contains an inline handler that orchestrates two ViewModel calls, which is borderline logic in the View.
5. CurrencySelectorWidget View contains `useEffect` side-effects (focus management, click-outside) and a utility function (`getFlagEmoji`) that should live in the ViewModel or shared utilities.

**Actionable next steps (priority order):**
1. Introduce Zod schemas for all entity types and derive TypeScript types via `z.infer`
2. Add `schema.parse()` calls at the API fetch boundary and localStorage boundary
3. Move UI state derivation (`status`, `errorMessage`, `isStale`) from `useRateData` into `useConverterVM`
4. Move `useEffect` side-effects and `getFlagEmoji` out of CurrencySelectorWidget View
5. Add a `handleSelectFavoritePair` method to `useConverterVM` to eliminate inline orchestration in the View
