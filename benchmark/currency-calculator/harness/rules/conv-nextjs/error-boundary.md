---
title: error.tsx Pattern
impact: MEDIUM
impactDescription: Incorrect error.tsx setup causes unhandled errors or missing recovery UI
tags: nextjs, error-boundary, use-client, error-handling, app-router
---

## error.tsx Pattern

**Impact: MEDIUM (Incorrect error.tsx setup causes unhandled errors or missing recovery UI)**

Next.js `error.tsx` files act as React Error Boundaries for their route segment. They **must** declare `'use client'` because Error Boundaries are inherently client-side (they use `componentDidCatch` internally). The component receives `error` and `reset` props -- always expose the `reset` function so users can retry without a full page reload.

**Incorrect (missing 'use client' directive or not exposing reset):**

```tsx
// app/(app)/products/[productId]/error.tsx
// BAD -- missing 'use client', will fail at runtime as Error Boundary
export default function Error({ error }: { error: Error }) {
  // BAD -- no reset prop, user cannot retry
  return <div>Something went wrong: {error.message}</div>;
}
```

**Correct (proper 'use client' directive with error and reset props):**

```tsx
// app/(app)/products/[productId]/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```
