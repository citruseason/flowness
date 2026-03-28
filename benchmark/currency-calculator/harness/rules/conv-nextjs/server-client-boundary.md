---
title: Server/Client Component Boundary
impact: CRITICAL
impactDescription: Wrong directive placement breaks SSR, inflates bundle size, or causes runtime errors
tags: nextjs, server-component, client-component, use-client, app-router
---

## Server/Client Component Boundary

**Impact: CRITICAL (Wrong directive placement breaks SSR, inflates bundle size, or causes runtime errors)**

Next.js App Router defaults every file to a Server Component. Only files that use browser APIs, hooks, or interactive state should declare `'use client'`. Misplacing the directive wastes server-side rendering benefits or causes hydration mismatches.

The boundary rules, mapped to the MVPVM + Domain-FSD architecture (see ARCHITECTURE.md), are:

- **Server Components (no directive):** `page.tsx`, `layout.tsx`, `loading.tsx`
- **Client Components (`'use client'` required):** `error.tsx`, widget/feature/entity `ui/` files that use hooks, `providers.tsx`
- **Shared (no directive needed):** pure-function modules such as schemas, selectors, fetch functions, and `queryOptions`

**Incorrect (adding 'use client' to a file that should be a Server Component):**

```typescript
// app/(app)/dashboard/page.tsx
'use client'; // WRONG -- page.tsx loses SSR and streaming capabilities

import { useSuspenseQuery } from '@tanstack/react-query';

export default function DashboardPage() {
  const { data } = useSuspenseQuery(/* ... */);
  return <Dashboard data={data} />;
}
```

**Correct (page.tsx stays a Server Component, client logic lives in widget ui files):**

```typescript
// app/(app)/dashboard/page.tsx  -- Server Component (no directive)
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { Suspense } from 'react';
import { DashboardWidget } from '@/domains/dashboard/widgets/dashboard/ui/DashboardWidget';
import { DashboardSkeleton } from '@/domains/dashboard/widgets/dashboard/ui/DashboardSkeleton';
import { dashboardQueries } from '@/domains/dashboard/entities/dashboard/api/queries';

export default async function DashboardPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(dashboardQueries.summary());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardWidget />
      </Suspense>
    </HydrationBoundary>
  );
}

// domains/dashboard/widgets/dashboard/ui/DashboardWidget.tsx
'use client'; // Correct -- widget UI uses hooks

import { useSuspenseQuery } from '@tanstack/react-query';

export function DashboardWidget() {
  const { data } = useSuspenseQuery(/* ... */);
  return <div>{/* render data */}</div>;
}
```
