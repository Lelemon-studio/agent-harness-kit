# React: SOLID & Anti-Patterns

Clean-code guidance for React (and React-based frameworks). Opinionated, but honest about what React actually rewards: small components, derived-not-stored state, race-safe data fetching, stable references, and composition over inheritance.

## Rules

### Single Responsibility (SRP)

Each component or hook should have ONE reason to change. When a component mixes formatting, analytics, side effects, and UI, split it.

```tsx
// Don't: one component doing formatting + analytics + mutation + UI
function ProductCard({ product }) {
  const [isSaved, setIsSaved] = useState(false);
  const price = new Intl.NumberFormat().format(product.price);
  useEffect(() => { analytics.track('view', product.id); }, []);
  const handleSave = async () => { await api.post(`/favorites/${product.id}`); };
  // ...
}

// Do: extract each concern
// utils/format.ts        -> formatPrice()
// hooks/useTrackView.ts  -> useTrackView()
// components/SaveButton  -> SaveButton
// components/ProductCard -> UI only, composes the rest
```

### Open/Closed (OCP)

Make components extensible without editing them. Drive visual variants through a variant map / config rather than branching on booleans.

```tsx
// Add new variants without touching the base component
const button = variants({
  base: 'inline-flex items-center',
  variant: { default: '...', destructive: '...', outline: '...' },
  size:    { sm: '...', md: '...', lg: '...' },
});
```

### Dependency Inversion (DIP)

Components should depend on abstractions (hooks, client modules), not on `fetch` calls inline. This keeps components testable and swappable.

```tsx
// Don't: component coupled to the transport
useEffect(() => { fetch('/api/orders').then(setOrders); }, []);

// Do: depend on a hook abstraction
const { data, isLoading } = useOrders(params);
```

### Composition over inheritance

Use `children`, slots, and render props. Never reach for `class extends` to share UI behavior.

```tsx
function Card({ children, header, footer }) {
  return (
    <div className="card">
      {header && <div className="card-header">{header}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}
```

### DRY / KISS / YAGNI

- Extract repeated logic into custom hooks; repeated UI into components; repeated transforms into shared utilities.
- Solve the problem in front of you. Prefer readable code over clever code; avoid premature abstraction.
- Don't add "just in case" features or one-off abstractions. Delete dead code.

## Anti-patterns

### `useEffect` to compute derived state

```tsx
// Don't: store derived state in an effect
const [filtered, setFiltered] = useState([]);
useEffect(() => { setFiltered(items.filter(i => i.active)); }, [items]);

// Do: derive during render
const filtered = items.filter(i => i.active);

// Do: memoize only if the computation is genuinely expensive
const filtered = useMemo(() => items.filter(i => i.active), [items]);
```

### `useEffect` to fetch without race-condition safety

Effect-based fetching races: a fast-changing dependency can let a stale response overwrite a fresh one.

```tsx
// Don't: no cancellation, last response wins regardless of order
useEffect(() => { fetch(`/api/${id}`).then(setData); }, [id]);

// Do: use a data-fetching library that handles caching + cancellation
const { data } = useQuery({ queryKey: ['item', id], queryFn: () => api.getById(id) });

// Do: if you must use an effect, guard against stale responses on cleanup
useEffect(() => {
  let cancelled = false;
  fetch(`/api/${id}`).then(r => { if (!cancelled) setData(r); });
  return () => { cancelled = true; };
}, [id]);
```

### Prop drilling

```tsx
// Don't: thread the same prop through 4+ levels
<Layout user={user}>
  <Sidebar user={user}>
    <Nav user={user}>
      <UserMenu user={user} />

// Do: read it where it's needed via context or a store hook
function UserMenu() {
  const user = useUser();
  // ...
}
```

### Unstable references passed as props

New object/array/function literals on every render break memoization and trigger needless re-renders.

```tsx
// Don't: a fresh reference each render
<Child
  config={{ theme: 'dark' }}
  items={['a', 'b']}
  onAction={() => doSomething()}
/>

// Do: hoist constants and stabilize callbacks
const CONFIG = { theme: 'dark' } as const;
const ITEMS = ['a', 'b'] as const;
const handleAction = useCallback(() => doSomething(), []);
```

### Wrong effect dependencies (infinite loops)

```tsx
// Don't: depend on the state the effect itself updates
useEffect(() => {
  setSettings({ ...result, time: Date.now() });
}, [settings]); // settings changes -> effect -> settings changes -> ...

// Do: depend only on the external inputs that should trigger it
useEffect(() => {
  fetchSettings().then(setSettings);
}, [userId]);
```

### Unstabilized callbacks from a parent

A callback recreated every render re-triggers child effects that depend on it.

```tsx
// Don't: onSearch is a new reference each render, so this effect keeps firing
useEffect(() => { onSearch(term); }, [term, onSearch]);

// Do: the parent stabilizes the callback
const handleSearch = useCallback((term) => { /* ... */ }, []);
```

### Array index as list key

```tsx
// Don't: index keys corrupt state when items reorder, insert, or delete
{items.map((item, i) => <Item key={i} />)}

// Do: use a stable unique id
{items.map(item => <Item key={item.id} />)}
```

### `console.log` left in production

```tsx
// Don't
console.log('debug', data);

// Do: keep only meaningful warn/error, or use a logger
console.warn('Unexpected state');
console.error('Failed to load', error);
```

### `any` in TypeScript

```tsx
// Don't
const data: any = response;

// Do: a concrete type
const data: Order = response;

// Do: unknown + narrowing when the shape isn't guaranteed
const data: unknown = response;
if (isOrder(data)) { /* data is Order here */ }
```
