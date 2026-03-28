---
title: page.tsx Must Be a Server Component
impact: CRITICAL
impactDescription: Using 'use client' in page.tsx eliminates SSR prefetch and streaming
tags: nextjs, page, server-component, ssr, app-router
---

## page.tsx Must Be a Server Component

**Impact: CRITICAL (Using 'use client' in page.tsx eliminates SSR prefetch and streaming)**

`page.tsx` is the SSR entry point for each route. It must remain a Server Component (an `async function` with no `'use client'` directive). Its responsibilities are strictly limited to orchestration tasks that only the server can perform.

Allowed in page.tsx:
- `await` / `void` prefetchQuery calls
- `dehydrate` + `HydrationBoundary`
- `<Suspense>` boundary placement
- `generateMetadata` export
- Widget composition and `params` forwarding

Forbidden in page.tsx:
- Business logic or data transformation
- Hook calls (`useState`, `useEffect`, `useSuspenseQuery`, etc.)
- Zustand store access
- Direct `fetch` calls (use `queryOptions` references instead)
- `'use client'` directive

**Incorrect (page.tsx declared as Client Component):**

```tsx
// app/(app)/products/[productId]/page.tsx
'use client';

export default function ProductDetailPage({ params }: { params: { productId: string } }) {
  // hooks, business logic, direct fetching -- all wrong for page.tsx
  const { data } = useSuspenseQuery(productQueries.detail(params.productId));
  const formatted = formatProduct(data);
  return <ProductDetail product={formatted} />;
}
```

**Correct (page.tsx is an async Server Component that prefetches and composes):**

```tsx
// app/(app)/products/[productId]/page.tsx
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { Suspense } from 'react';
import { ProductDetail } from '@/domains/product/widgets/product-detail/ui/ProductDetail';
import { ProductDetailSkeleton } from '@/domains/product/widgets/product-detail/ui/ProductDetailSkeleton';
import { productQueries } from '@/domains/product/entities/product/api/queries';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery(productQueries.detail(productId));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetail productId={productId} />
      </Suspense>
    </HydrationBoundary>
  );
}
```
