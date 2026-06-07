# Next.js Frontend Performance (App Router)

Performance guidelines for Next.js App Router frontends. Opinionated, but honest about the framework: measure before you optimize, push work to the server, and only ship client JavaScript where you truly need interactivity.

## Rules

### Server Components by default
Components in the App Router are Server Components unless you opt out. Keep them on the server so they ship zero JavaScript to the client.

```tsx
// Server Component (default) — no JS sent to the client
export default async function Page() {
  const data = await fetchData();
  return <div>{data.title}</div>;
}
```

Add `"use client"` **only** when the component needs:
- React state or effects (`useState`, `useEffect`, and most hooks)
- Event handlers (`onClick`, `onChange`, ...)
- Browser-only APIs (`window`, `localStorage`, `IntersectionObserver`, ...)

Push the `"use client"` boundary as far down the tree as possible. A small interactive leaf (e.g. a button) should be the client component, not the whole page.

### Fetch in parallel — no waterfalls
Independent requests should run concurrently. Sequential `await`s create request waterfalls that add up latency.

```tsx
// Bad — waterfall: each await blocks the next
const user = await fetchUser();
const orders = await fetchOrders(user.id);
const notifications = await fetchNotifications();

// Good — parallel: only the dependent call waits
const user = await fetchUser();
const [orders, notifications] = await Promise.all([
  fetchOrders(user.id),
  fetchNotifications(),
]);
```

Only chain `await`s when one request genuinely depends on the result of another. Use Suspense boundaries to stream independent sections instead of blocking the whole page.

### Optimize images with `next/image`
Always serve responsive, lazy-loaded images. Set `sizes` so the browser picks the right resolution, and reserve `priority` strictly for above-the-fold images.

```tsx
import Image from "next/image";

<Image
  src={item.image}
  alt={item.title}
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  priority={isAboveFold} // above-the-fold only — never blanket-apply
  placeholder="blur"
  blurDataURL={blurHash}
/>;
```

### Lazy-load heavy client components
Code-split components that are large, rarely used, or below the fold with `next/dynamic`. Disable SSR (`ssr: false`) only for components that depend on the browser and have no meaningful server render.

```tsx
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () => import("@/components/forms/rich-text-editor"),
  { loading: () => <Skeleton />, ssr: false },
);

const Chart = dynamic(() => import("@/components/charts/stats-chart"), {
  loading: () => <Skeleton className="h-[400px]" />,
});
```

### Virtualize long lists
For lists beyond a few hundred items, render only what's visible. Rendering thousands of DOM nodes tanks scroll performance and memory.

```tsx
// >100 items → virtualize
import { useVirtualizer } from "@tanstack/react-virtual";

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => containerRef.current,
  estimateSize: () => 200,
  overscan: 5,
});
```

### `useMemo` / `useCallback` — measure first
Memoize only when there's a real cost: an expensive computation, or a callback passed to a memoized child. Skip it for trivial values; the bookkeeping can cost more than the work it saves.

```tsx
// Unnecessary — trivial computation
const count = useMemo(() => items.length, [items]);

// Worth it — heavy processing
const processed = useMemo(
  () => data.map(expensiveTransform).sort(complexSort),
  [data],
);

// Worth it — stable callback for a memoized child
const handleClick = useCallback((id: string) => {
  setItems((prev) => prev.filter((i) => i.id !== id));
}, []);
<MemoizedList onItemClick={handleClick} />;
```

### `React.memo` strategically
Wrap components that re-render often with stable props. A custom comparator can help when props are objects, but keep it cheap and correct.

```tsx
// Re-renders often, props usually stable
const OrderCard = memo(function OrderCard({ order }) {
  return <article>...</article>;
});

// Custom comparator
const Chart = memo(
  function Chart({ data, config }) {
    return null;
  },
  (prev, next) => prev.data.length === next.data.length,
);
```

### Bundle hygiene — avoid barrel imports
Importing from a barrel (`index.ts` that re-exports everything) can pull in far more than you use. Import directly from the source module. Note that Next.js can auto-optimize some packages via `optimizePackageImports`, but direct imports are the safe default.

```tsx
// Pulls in more than needed
import { Button, Input, Card } from "@/components/ui";

// Direct imports — only what you use
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
```

### Prefetch & preload deliberately
`next/link` prefetches in-viewport routes by default. Preload only genuinely critical assets (a hero font, a key image) — over-preloading competes for bandwidth with what the user needs now.

```tsx
import Link from "next/link";

<Link href="/orders">View all</Link>;

// Critical font only
<link rel="preload" href="/fonts/app.woff2" as="font" crossOrigin="anonymous" />;
```

## Anti-patterns

- Marking a whole page `"use client"` because one button needs `onClick`. Isolate the interactive leaf instead.
- Sequential `await`s for independent data — a hidden waterfall.
- `priority` on every image (defeats lazy loading and competes for bandwidth).
- `<img>` instead of `next/image` for content images (no sizing, no lazy loading, layout shift).
- Memoizing trivial values "just in case" — adds noise and dependency-array bugs.
- `React.memo` on a component whose props change on every render — pure overhead.
- Rendering thousands of list rows without virtualization.
- Barrel imports for large UI/icon libraries when direct imports tree-shake better.

## Measure

Optimize against numbers, not vibes. Profile with the React DevTools, run Lighthouse, and inspect the bundle.

```bash
# Bundle analysis (with @next/bundle-analyzer wired up)
ANALYZE=true npm run build
```

Core Web Vitals targets:
- **LCP** < 2.5s
- **INP** < 200ms
- **CLS** < 0.1
