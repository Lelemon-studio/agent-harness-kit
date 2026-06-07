# Testing (TypeScript)

One cohesive set of rules across the testing pyramid: unit, component, and
end-to-end. Tools referenced are framework-honest examples (Vitest/Jest,
Testing Library, Playwright); the principles apply regardless of runner.

## Layout

```
tests/
├── unit/              # Pure functions, utilities
├── integration/       # API + DB boundaries
├── components/        # UI component tests
├── fixtures/          # Test data
├── helpers/           # Factories and utilities
└── setup.ts           # Global setup

e2e/
├── fixtures/          # API mocks and seed data
├── page-objects/      # Page Object Model
├── utils/             # Helpers
└── <feature>.spec.ts  # One spec per feature
```

## Rules

### Structure every test as Arrange-Act-Assert

```typescript
it('applies the discount to the cart total', () => {
  // Arrange
  const cart = createCart([
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 },
  ]);

  // Act
  const total = calculateTotal(cart, 0.1);

  // Assert
  expect(total).toBe(225); // (200 + 50) * 0.9
});
```

### Name tests after the behavior, not the mechanism

```typescript
// Good
it('returns an empty array when no items match the filter', () => {});
it('throws ValidationError when the email is malformed', () => {});

// Bad
it('works correctly', () => {});
it('handles edge case', () => {});
```

### Assert behavior, not implementation

Test the observable result a caller would see, not internal state or which
private method got called. Implementation tests break on every refactor and
prove nothing about correctness.

```typescript
// Bad — couples the test to internals
const setStateSpy = vi.spyOn(component, 'setState');
component.updateName('Ada');
expect(setStateSpy).toHaveBeenCalledWith({ name: 'Ada' });

// Good — asserts the visible outcome
component.updateName('Ada');
expect(component.getName()).toBe('Ada');
```

### Make assertions specific

A test that only checks "it didn't blow up" gives false confidence. Assert the
actual expected value or shape.

```typescript
// Bad
const items = await getItems();
expect(items).toBeDefined();

// Good
const items = await getItems({ status: 'active' });
expect(items).toHaveLength(3);
expect(items.every((i) => i.status === 'active')).toBe(true);
```

### Use factory functions for test data

A factory with sensible defaults plus overrides keeps tests focused on the one
field that matters and avoids hardcoded duplication.

```typescript
function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

const admin = createUser({ role: 'admin' });
```

### Keep each test independent

No shared mutable state, no ordering dependencies. Each test sets up everything
it needs and must pass in isolation.

```typescript
it('increments the counter', () => {
  const counter = createCounter();
  counter.increment();
  expect(counter.value).toBe(1);
});
```

### Mock only what is necessary

Mock external boundaries (network, clock, third-party SDKs), not the code under
test. If you mock everything, the test asserts nothing real. Prefer a real
integration or a minimal mock.

```typescript
// Good — mock only the network boundary, clean up between tests
vi.mock('@/lib/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());
```

### Always test error cases

```typescript
it('throws when dividing by zero', () => {
  expect(() => divide(10, 0)).toThrow('Division by zero');
});

it('rejects when the record is missing', async () => {
  await expect(getUser(999)).rejects.toThrow('not found');
});
```

### Await your promises

A test that fires an async call without awaiting it passes even when the call
fails. Always `await` or `return` the promise.

```typescript
it('saves the record', async () => {
  const result = await save({ name: 'Ada' });
  expect(result.id).toBeDefined();
});
```

### Use fake timers instead of real waits

```typescript
it('times out after 5 seconds', async () => {
  vi.useFakeTimers();
  const promise = slowOperation();
  vi.advanceTimersByTime(5000);
  await expect(promise).rejects.toThrow('Timeout');
  vi.useRealTimers();
});
```

## Component tests (Testing Library)

### Query in priority order

Prefer queries a real user (and assistive tech) would rely on. Drop to lower
options only when the higher one is impossible.

1. `getByRole` — role + accessible name (accessibility first)
2. `getByLabelText` — form fields
3. `getByText` — visible content
4. `getByTestId` — last resort

### Drive interactions with userEvent, not fireEvent

`userEvent` simulates real user behavior (focus, key sequences, pointer
events); `fireEvent` dispatches a single low-level event and can pass when the
real interaction would fail.

```typescript
import userEvent from '@testing-library/user-event';

await userEvent.click(button);
await userEvent.type(input, 'hello');
```

### Assert on what the user observes

```typescript
// Bad — internal state, or no assertion at all
expect(component.state.isOpen).toBe(true);

// Good
expect(screen.getByRole('dialog')).toBeVisible();
```

Prefer mocking the network with a request-interception layer (e.g. MSW) over
mocking hooks, so the component exercises its real data-fetching path.

## End-to-end tests (Playwright)

### Rely on auto-wait — never sleep

Playwright auto-waits for elements and assertions. Arbitrary timeouts are a
flaky-test smell: they either slow the suite or race the app.

```typescript
// Good
await expect(page.getByRole('button')).toBeVisible();
await page.getByRole('button').click();

// Never
await page.waitForTimeout(1000);
```

Wait on specific conditions instead: `waitForResponse`, `waitForURL`,
`waitForLoadState`, or an assertion that an element appeared/disappeared.

```typescript
const response = page.waitForResponse('**/api/items');
await page.getByRole('button', { name: 'Save' }).click();
expect((await response).ok()).toBe(true);
```

### Select by role and accessible name

Same priority order as component tests: role/name > label > placeholder > text
> test id. Avoid CSS classes, generic ids, and DOM-structure selectors — they
break on any style or markup refactor.

```typescript
// Good
page.getByRole('button', { name: 'Submit' });

// Fragile
page.locator('.btn-primary');
page.locator('div > button:nth-child(2)');
```

### Use Playwright's auto-retrying assertions

`expect(locator)` retries until it passes or times out; reading text and
asserting with the bare matcher does not retry and is flaky.

```typescript
// Good
await expect(page.getByRole('alert')).toContainText('Error');
await expect(page).toHaveURL('/dashboard');

// Flaky
const text = await page.getByRole('alert').textContent();
expect(text).toContain('Error');
```

### Mock external APIs with `page.route()`

```typescript
await page.route('**/api/items', (route) =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ items: [{ id: 1, name: 'Test' }] }),
  }),
);
```

### Model pages with the Page Object Model

Keep locators and actions in one class per screen so specs read as behavior and
selectors live in a single place.

```typescript
export class LoginPage {
  constructor(private page: Page) {}

  get emailInput() { return this.page.getByLabel('Email'); }
  get passwordInput() { return this.page.getByLabel('Password'); }
  get submitButton() { return this.page.getByRole('button', { name: 'Sign in' }); }

  async goto() { await this.page.goto('/login'); }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

### Use a configured baseURL

```typescript
// Good — portable
await page.goto('/login');

// Bad — hardcoded host
await page.goto('http://localhost:3000/login');
```

### Keep e2e tests small and self-contained

One focused behavior per test; set up your own data instead of depending on a
prior test having run.

## Anti-patterns

- One test asserting many unrelated concepts. Assert one concept per test.
- Tests coupled by shared mutable state or execution order.
- Asserting internal state (`component.state.x`) or spying on private methods.
- Mocking everything until the test no longer exercises real code.
- Weak assertions (`toBeDefined()` only) that can't detect a regression.
- Ignored/un-awaited promises that let failing tests pass.
- Excessive snapshot tests that capture noise and rot.
- `waitForTimeout` / arbitrary sleeps in e2e.
- CSS-class, generic-id, or `nth-child` selectors.
- Hardcoded full URLs instead of a configured `baseURL`.
- Monolithic "complete flow" tests doing dozens of steps.
- Leftover `console.log` / `debugger`.

## Coverage

- Target ~70% across branches, functions, lines, statements as a floor.
- Don't chase 100% on trivial code; spend effort on logic and error paths.
- Coverage is a signal, not a goal — a high number with weak assertions is
  worse than honest gaps.

## Config sketches

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // 'jsdom' for component tests
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: { branches: 70, functions: 70, lines: 70, statements: 70 },
    },
    testTimeout: 10000,
  },
});
```

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Checklist for a new test

- [ ] Name describes the expected behavior
- [ ] Clear Arrange-Act-Assert structure
- [ ] Independent of other tests and of order
- [ ] Test data comes from a factory/fixture
- [ ] Mocks are minimal and scoped to real boundaries
- [ ] Assertions are specific, not just `toBeDefined()`
- [ ] Error/edge cases are covered
- [ ] Async paths are awaited
- [ ] (Component/e2e) selects by role/label, not CSS class
- [ ] (e2e) no `waitForTimeout`; uses auto-retrying assertions
- [ ] No leftover `console.log` / `debugger`
