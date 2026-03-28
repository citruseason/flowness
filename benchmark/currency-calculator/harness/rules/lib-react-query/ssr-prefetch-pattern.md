---
title: SSR Prefetch Pattern
impact: HIGH
impactDescription: Ensures server-rendered HTML contains data and avoids client-side refetching
tags: react-query, ssr, prefetch, streaming, next-js, server-component
---

## SSR Prefetch Pattern

**Impact: HIGH (Ensures server-rendered HTML contains data and avoids client-side refetching)**

Server Components must prefetch data using the same `queryOptions` factory from `entities/*/api/queries.ts`. This guarantees the server populates the same cache entry that client components read via `useSuspenseQuery`, preventing a redundant network request after hydration.

The choice between `await` and `void` on `prefetchQuery` controls streaming behavior:

- `await queryClient.prefetchQuery(...)` -- blocks the response until data is ready, producing complete HTML (better for SEO-critical content).
- `void queryClient.prefetchQuery(...)` -- sends the shell immediately and streams data in when ready (better for TTFB on non-critical content).

After prefetching, dehydrate the `queryClient` and wrap client components in a `HydrationBoundary` to transfer the cache.

**Incorrect (inline queryKey/queryFn in server component -- key mismatch with client):**

```typescript
// app/converter/page.tsx
import { QueryClient } from "@tanstack/react-query";
import { getExchangeRates } from "@/domains/currency/entities/rate/api/get-exchange-rates";

export default async function ConverterPage() {
  const queryClient = new QueryClient();

  // BAD: queryKey defined inline -- may not match the client's rateQueries.all()
  await queryClient.prefetchQuery({
    queryKey: ["exchange-rates", "USD"],
    queryFn: () => getExchangeRates("USD"),
  });

  return <Converter />;
}
```

**Correct (reusing entity queryOptions for guaranteed cache match):**

```typescript
// app/converter/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { rateQueries } from "@/domains/currency/entities/rate/api/queries";
import { currencyQueries } from "@/domains/currency/entities/currency/api/queries";
import { Converter } from "@/domains/currency/widgets/converter/ui/converter";

export default async function ConverterPage() {
  const queryClient = new QueryClient();

  // Blocking: critical data included in initial HTML
  await queryClient.prefetchQuery(rateQueries.all("USD"));

  // Streaming: shell sent immediately, data streamed in
  void queryClient.prefetchQuery(currencyQueries.list());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Converter />
    </HydrationBoundary>
  );
}
```
