---
title: loading.tsx vs Page Suspense
impact: MEDIUM
impactDescription: Misusing loading.tsx or page Suspense leads to suboptimal loading UX
tags: nextjs, loading, suspense, ux, app-router
---

## loading.tsx vs Page Suspense

**Impact: MEDIUM (Misusing loading.tsx or page Suspense leads to suboptimal loading UX)**

Next.js provides two mechanisms for showing loading states, and they serve different purposes:

- **`loading.tsx`** -- wraps the entire route segment. Shown during SPA navigation while the Server Component executes (including any `await` prefetch calls). Renders a route-level skeleton instantly.
- **Page-internal `<Suspense>`** -- wraps individual widgets. Enables per-widget streaming so that fast widgets render while slow widgets show their own skeletons.

Use `loading.tsx` for the coarse, route-level loading state. Use page-internal `<Suspense>` for fine-grained, widget-level streaming.

**Incorrect (relying solely on loading.tsx with no widget-level Suspense):**

```tsx
// app/(app)/trips/[tripId]/loading.tsx
export default function Loading() {
  return <FullPageSkeleton />;
}

// app/(app)/trips/[tripId]/page.tsx
export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const queryClient = new QueryClient();

  // All queries awaited -- page blocked until everything resolves
  await queryClient.prefetchQuery(tripQueries.detail(tripId));
  await queryClient.prefetchQuery(scheduleQueries.byTrip(tripId));
  await queryClient.prefetchQuery(expenseQueries.byTrip(tripId));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* No Suspense -- all-or-nothing rendering */}
      <TripEditor tripId={tripId} />
      <TripScheduleList tripId={tripId} />
      <TripExpenseSummary tripId={tripId} />
    </HydrationBoundary>
  );
}
```

**Correct (loading.tsx for route-level + Suspense for widget-level streaming):**

```tsx
// app/(app)/trips/[tripId]/loading.tsx
export default function Loading() {
  return <TripPageSkeleton />;  // Shown instantly during SPA navigation
}

// app/(app)/trips/[tripId]/page.tsx
export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const queryClient = new QueryClient();

  // Core: await (loading.tsx covers wait time during navigation)
  await queryClient.prefetchQuery(tripQueries.detail(tripId));

  // Secondary: void (stream via individual Suspense boundaries)
  void queryClient.prefetchQuery(scheduleQueries.byTrip(tripId));
  void queryClient.prefetchQuery(expenseQueries.byTrip(tripId));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<TripEditorSkeleton />}>
        <TripEditor tripId={tripId} />
      </Suspense>
      <Suspense fallback={<ScheduleListSkeleton />}>
        <TripScheduleList tripId={tripId} />
      </Suspense>
      <Suspense fallback={<ExpenseSummarySkeleton />}>
        <TripExpenseSummary tripId={tripId} />
      </Suspense>
    </HydrationBoundary>
  );
}
```
