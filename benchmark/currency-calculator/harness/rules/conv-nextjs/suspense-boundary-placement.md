---
title: Suspense Boundary Placement
impact: HIGH
impactDescription: Missing or coarse Suspense boundaries prevent independent streaming
tags: nextjs, suspense, streaming, ssr, performance
---

## Suspense Boundary Placement

**Impact: HIGH (Missing or coarse Suspense boundaries prevent independent streaming)**

Each `<Suspense>` boundary in a Server Component defines a streaming chunk. Widgets that load independently must each be wrapped in their own `<Suspense>` so one slow widget does not block the others. When using `void` prefetch without a corresponding `<Suspense>`, the streaming data has nowhere to resolve, breaking the pattern entirely.

Two valid strategies:
- **Flat boundaries** -- each widget gets its own `<Suspense>` for fully independent streaming (recommended)
- **Nested boundaries** -- progressive disclosure where a parent loads before revealing child suspense zones

**Incorrect (void prefetch without a Suspense boundary):**

```tsx
// app/(app)/trips/[tripId]/page.tsx
export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const queryClient = new QueryClient();

  void queryClient.prefetchQuery(scheduleQueries.byTrip(tripId));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* BAD -- no Suspense boundary, streaming data cannot resolve */}
      <TripScheduleList tripId={tripId} />
    </HydrationBoundary>
  );
}
```

**Correct (each independently-loaded widget wrapped in its own Suspense):**

```tsx
// app/(app)/trips/[tripId]/page.tsx
export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery(tripQueries.detail(tripId));
  void queryClient.prefetchQuery(scheduleQueries.byTrip(tripId));
  void queryClient.prefetchQuery(expenseQueries.byTrip(tripId));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* Chunk 1 -- already resolved via await */}
      <Suspense fallback={<TripEditorSkeleton />}>
        <TripEditor tripId={tripId} />
      </Suspense>

      {/* Chunk 2 -- streams independently */}
      <Suspense fallback={<ScheduleListSkeleton />}>
        <TripScheduleList tripId={tripId} />
      </Suspense>

      {/* Chunk 3 -- streams independently */}
      <Suspense fallback={<ExpenseSummarySkeleton />}>
        <TripExpenseSummary tripId={tripId} />
      </Suspense>
    </HydrationBoundary>
  );
}
```
