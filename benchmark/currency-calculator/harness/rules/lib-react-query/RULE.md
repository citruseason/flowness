# React Query Library Rules

## Overview
React Query (TanStack Query) manages all server state in this project. It bridges the Model layer (query definitions) and the Presenter layer (data orchestration) within the MVPVM + Domain-FSD architecture. Suspense mode is the default for reads, and SSR prefetch uses the same query definitions to share cache between server and client. These rules ensure query definitions stay reusable, mutations follow the dependency hierarchy, and Suspense semantics are used correctly.

## When to Apply
- Defining query keys and query functions for an entity API
- Composing multiple queries in a use-case or feature hook
- Writing mutations that invalidate cached data
- Prefetching data in a Server Component for SSR/Streaming
- Reviewing code that imports from `@tanstack/react-query`

## Rules

| Rule | Impact | Description |
|------|--------|-------------|
| [queryOptions Factory in Entities](./query-options-factory.md) | CRITICAL | Define queryOptions factories in entities/api so server and client share identical cache keys |
| [Suspense Query Usage](./suspense-query-usage.md) | HIGH | Use useSuspenseQuery/useSuspenseQueries and let Suspense boundaries handle loading states |
| [SSR Prefetch Pattern](./ssr-prefetch-pattern.md) | HIGH | Reuse entity queryOptions in Server Components with await/void to control streaming behavior |
| [Mutation Placement](./mutation-placement.md) | HIGH | Place single mutations in features and complex mutations in use-cases |
| [Query Key Conventions](./query-key-conventions.md) | MEDIUM | Structure query keys hierarchically using the queryOptions factory as the single source |
| [ViewModel Query Boundary](./viewmodel-query-boundary.md) | MEDIUM | ViewModels must not call React Query hooks directly -- delegate to use-cases and features |
