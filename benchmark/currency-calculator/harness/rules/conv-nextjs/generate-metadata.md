---
title: generateMetadata for SEO
impact: MEDIUM
impactDescription: Missing or hardcoded metadata degrades search engine visibility
tags: nextjs, seo, metadata, generatemetadata, app-router
---

## generateMetadata for SEO

**Impact: MEDIUM (Missing or hardcoded metadata degrades search engine visibility)**

Dynamic routes should export an async `generateMetadata` function to produce route-specific `<title>` and `<meta>` tags. This function runs on the server alongside the page and can fetch the same data the page uses. Do not hardcode metadata or set it from the client side -- search engine crawlers rely on server-rendered `<head>` content.

The `generateMetadata` function receives the same `params` as the page component and must return a `Metadata` object.

**Incorrect (hardcoded or client-side metadata):**

```tsx
// app/(app)/products/[productId]/page.tsx

// BAD -- hardcoded title, ignores the actual product
export const metadata = {
  title: 'Product Detail',
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  // ...
}
```

**Correct (dynamic generateMetadata using route params):**

```tsx
// app/(app)/products/[productId]/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProduct(productId);

  return {
    title: `${product.name} | MyApp`,
    description: product.description,
  };
}

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
