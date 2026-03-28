---
title: Streaming SSR Strategy
impact: HIGH
impactDescription: Incorrect prefetch strategy degrades TTFB or loses SEO content
tags: nextjs, streaming, ssr, prefetch, ttfb, seo
---

## Streaming SSR Strategy

**Impact: HIGH (Incorrect prefetch strategy degrades TTFB or loses SEO content)**

When calling `prefetchQuery` in a Server Component, the `await` vs `void` keyword determines whether the server blocks on that data or streams it later. The correct strategy depends on SEO requirements and query latency.

Strategy selection guide:

| Condition | Strategy |
|-----------|----------|
| SEO-critical + fast query | `await` all |
| SEO-critical + slow secondary data | `await` core + `void` secondary (recommended) |
| No SEO + TTFB matters | `void` all |
| Authenticated pages | `void` all |

**Incorrect (awaiting all prefetches including slow secondary queries):**

```tsx
// app/(app)/trips/[tripId]/page.tsx
export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const queryClient = new QueryClient();

  // BAD -- slow queries block TTFB, user sees nothing until all resolve
  await Promise.all([
    queryClient.prefetchQuery(tripQueries.detail(tripId)),
    queryClient.prefetchQuery(scheduleQueries.byTrip(tripId)),   // slow
    queryClient.prefetchQuery(expenseQueries.byTrip(tripId)),    // slow
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* ... */}
    </HydrationBoundary>
  );
}
```

**Correct (await core data, void secondary data for streaming):**

```tsx
// app/(app)/trips/[tripId]/page.tsx
export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const queryClient = new QueryClient();

  // Core data: block until ready (SEO + fast)
  await queryClient.prefetchQuery(tripQueries.detail(tripId));

  // Secondary data: stream in via Suspense (slower, not SEO-critical)
  void queryClient.prefetchQuery(scheduleQueries.byTrip(tripId));
  void queryClient.prefetchQuery(expenseQueries.byTrip(tripId));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<TripEditorSkeleton />}>
        <TripEditor tripId={tripId} />
      </Suspense>

      <Suspense fallback={<TripScheduleListSkeleton />}>
        <TripScheduleList tripId={tripId} />
      </Suspense>

      <Suspense fallback={<TripExpenseSkeleton />}>
        <TripExpenseSummary tripId={tripId} />
      </Suspense>
    </HydrationBoundary>
  );
}
```

The streaming flow for the correct pattern:
1. Server awaits trip data, begins rendering
2. Initial HTML ships with completed `TripEditor` + skeleton fallbacks
3. As each `void` query resolves, the server streams a replacement chunk
4. Client hydrates with all data already in the query cache
