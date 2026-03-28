# Next.js App Router Conventions

## Overview
Defines conventions for Next.js 15 App Router usage within the MVPVM + Domain-FSD architecture. The App Router serves as the **Page layer** in MVPVM -- it owns no business logic and is responsible only for SSR prefetch/streaming, Suspense/Error boundaries, and widget composition. Correct Server/Client component boundaries and streaming strategies are critical for performance, SEO, and maintainability.

## When to Apply
- Creating or modifying files under the `app/` directory (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`)
- Deciding where to place `'use client'` directives
- Configuring SSR prefetch strategies (`await` vs `void`)
- Placing `<Suspense>` boundaries in page components
- Adding SEO metadata via `generateMetadata`

## Rules

| Rule | Impact | Description |
|------|--------|-------------|
| [Server/Client Component Boundary](./server-client-boundary.md) | CRITICAL | Files must follow the correct Server/Client component directive rules |
| [page.tsx Must Be a Server Component](./page-server-component.md) | CRITICAL | page.tsx must never use 'use client' -- it is the SSR entry point |
| [Streaming SSR Strategy](./streaming-ssr-strategy.md) | HIGH | Use await for critical data and void for secondary data in prefetch calls |
| [Suspense Boundary Placement](./suspense-boundary-placement.md) | HIGH | Each independently-streamable widget must have its own Suspense boundary |
| [loading.tsx vs Page Suspense](./loading-vs-suspense.md) | MEDIUM | Understand when to use route-level loading.tsx vs page-internal Suspense |
| [error.tsx Pattern](./error-boundary.md) | MEDIUM | error.tsx must declare 'use client' and follow the reset pattern |
| [generateMetadata for SEO](./generate-metadata.md) | MEDIUM | Use the generateMetadata export for dynamic SEO metadata |
