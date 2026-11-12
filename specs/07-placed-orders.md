# Spec 07 — Placed orders

| | |
|---|---|
| **Status** | Ready |
| **Depends on** | [03 — Instruments](./03-instruments.md) (public `useInstruments` hook), [05 — Portfolio](./05-portfolio.md), [06 — Orders](./06-orders.md) |
| **Owns** | `GET /orders` contract, placed-orders query and UI in the order feature, the "Placed orders" section of the portfolio page, `orders.history` i18n keys |

## 1. Goal

Below the positions on the portfolio page, add a **Placed orders** section that lists every order the candidate has sent:

- fetch `GET /orders`
- newest first, every order (no pagination, no filters)
- columns: date/time, instrument (ticker), side, type, quantity, price, total, status
- refresh after an order is placed
- handle loading, error and empty states on their own, without blocking the rest of the page
- table on desktop, cards on mobile
- fully localized in EN/ES

This reverses the "no order history" scope rule in `AGENTS.md`, spec 05 §11 and spec 06 §12. See `sessions/12-placed-orders-scope.md`.

## 2. Files owned

Create or modify only:

```text
docs/api/openapi.yaml
src/shared/api/generated/schema.ts            (regenerated, never by hand)
src/shared/api/queryKeys.ts

src/entities/order/model/metrics.ts
src/entities/order/model/metrics.test.ts

src/shared/lib/format.ts
src/shared/lib/format.test.ts
src/shared/i18n/useFormat.ts

src/features/order/api.ts
src/features/order/queries.ts
src/features/order/mutations.ts
src/features/order/index.ts
src/features/order/ui/PlacedOrdersTable.tsx
src/features/order/ui/PlacedOrdersTable.module.scss
src/features/order/ui/PlacedOrdersCards.tsx
src/features/order/ui/PlacedOrdersCards.module.scss
src/features/order/ui/PlacedOrdersSkeleton.tsx
src/features/order/ui/PlacedOrdersSkeleton.module.scss

src/pages/portfolio/PortfolioPage.tsx
src/pages/portfolio/PortfolioPage.module.scss
src/pages/portfolio/PlacedOrdersSection.tsx
src/pages/portfolio/errorKey.ts

src/shared/i18n/locales/en/orders.ts
src/shared/i18n/locales/es/orders.ts

src/test/fixtures/orders.ts
src/test/msw/handlers.ts
src/test/msw/handlers.test.ts
vitest.config.ts

src/pages/portfolio/placedOrders.test.tsx
src/features/order/orderModal.test.tsx         (invalidation assertion only)
```

Do not modify the router, layout, shared UI, the HTTP client, the order modal or the instruments/portfolio features.

## 3. API contract

The live API (checked 2026-11-11) answers `GET /orders`:

- `200` with an array of `Order` (the same schema `POST /orders` returns), **oldest first**
- `[]` for a new candidate
- `400 { "error": "Missing X-Candidate-Id header" }` without the candidate header
- `400` without `X-Enable-Bugs`, like every endpoint
- no paging or filters: query parameters such as `?limit=1` are ignored

Add the operation to `docs/api/openapi.yaml` under the existing `/orders` path:

```yaml
    get:
      tags: [orders]
      operationId: listOrders
      summary: List the candidate's orders
      description: |
        Every order the candidate has sent, oldest first. No paging or filters.
      parameters:
        - $ref: '#/components/parameters/EnableBugsHeader'
        - $ref: '#/components/parameters/CandidateIdHeader'
      responses:
        '200':
          description: The candidate's orders.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Order'
        '400':
          $ref: '#/components/responses/BadRequest'
```

Then run `npm run api:types` and `npm run api:types:check`. No new type alias is needed: `Order` already exists in `shared/api/types.ts`.

`src/shared/api/queryKeys.ts` gains:

```ts
orders: ['orders'] as const,
```

## 4. Domain

`src/entities/order/model/metrics.ts`:

```ts
import type { Order } from '@/shared/api/types'

/** quantity × price, rounded to cents. `null` when either value is not a finite number. */
export function orderTotal(order: Pick<Order, 'quantity' | 'price'>): number | null

/** Sort comparator: newest `created_at` first; ties broken by higher `id` first. */
export function compareNewestFirst(a: Order, b: Order): number
```

- `orderTotal` uses `round2` and `isFiniteNumber` from `shared/lib/math`.
- `compareNewestFirst` compares `Date.parse(created_at)`. An unparseable date sorts last.
- The total is shown for every status. For a PENDING or REJECTED order it is the amount the order asked for, not money that moved.

## 5. Date formatting

`src/shared/lib/format.ts` gains:

```ts
/** ISO date-time → localized date and time in the browser's time zone. `null` if unparseable. */
export function formatDateTime(value: string | null | undefined, locale: AppLocale): string | null
```

- `Intl.DateTimeFormat(getIntlLocale(locale), { dateStyle: 'medium', timeStyle: 'short' })`
- follows the UI language, like the other formatters
- `useFormat()` exposes it as `dateTime(value)`

Tests need a fixed time zone. Set `env: { TZ: 'UTC' }` in `vitest.config.ts` (`test` block). Expected UTC output for `2026-11-12T01:53:34.884Z`:

- EN: `Nov 12, 2026, 1:53 AM`
- ES: `12 nov 2026, 1:53 a. m.`

These are Node 26's ICU output (checked 2026-11-11), with plain spaces. If a different Node or ICU version prints another form (for example a narrow no-break space before `AM`), assert the real output and note it in the PR. Do not loosen the assertion to a regex.

## 6. Data layer (order feature)

### `api.ts`

```ts
export async function getOrders(signal?: AbortSignal): Promise<Order[]> {
  return http.get<Order[]>('/orders', { signal })
}
```

### `queries.ts`

```ts
export function usePlacedOrders() {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: ({ signal }) => getOrders(signal),
    select: (orders) => orders.toSorted(compareNewestFirst),
    staleTime: 30_000,
  })
}
```

### `mutations.ts`

`useCreateOrder` keeps `retry: false` and, in `onSuccess`, invalidates **both** `queryKeys.portfolio` and `queryKeys.orders`. No optimistic update.

### `index.ts`

Also export `usePlacedOrders`, `PlacedOrdersTable`, `PlacedOrdersCards` and `PlacedOrdersSkeleton`.

## 7. UI

### Instrument lookup

The order list only carries `instrument_id`. The order feature does not know about instruments, so its components take a lookup through props:

```ts
interface PlacedOrdersProps {
  orders: Order[]
  /** instrument_id → ticker. Missing ids render `orders.history.unknownInstrument`. */
  tickers: ReadonlyMap<number, string>
}
```

`PlacedOrdersTable` and `PlacedOrdersCards` both take these props.

### Desktop (`>= 768px`) — `PlacedOrdersTable`

Semantic table with a visually hidden `<caption>` (`orders.history.caption`):

| Column | Content |
|---|---|
| Date | `<time dateTime={created_at}>` with `dateTime()`; `—` if invalid |
| Instrument | ticker, or `orders.history.unknownInstrument` (`#{{id}}`) |
| Side | `orders.side.BUY` / `orders.side.SELL` |
| Type | `orders.type.MARKET` / `orders.type.LIMIT` |
| Quantity | `quantity()`, tabular numbers |
| Price | `MoneyText` |
| Total | `MoneyText` with `orderTotal(order)` |
| Status | `OrderStatusBadge` (translated label + raw code, from spec 06) |

Numeric columns are right-aligned. Rows are not interactive: no click, no action column.

### Mobile (`< 768px`) — `PlacedOrdersCards`

One `<article>` per order showing the same eight values. The visible title of each card is the ticker and the status badge. **Do not use an `<h3>` for the ticker**: the positions cards already use `<h3>` tickers, and portfolio tests find cards by that heading. Use a `<p>` or `<strong>` instead.

Table and cards are both rendered and toggled with CSS at `md`, as in spec 05.

### `PlacedOrdersSkeleton`

Three skeleton rows (table) / three skeleton cards (mobile), plus visually hidden `common.loading`.

## 8. Page composition

`src/pages/portfolio/PlacedOrdersSection.tsx` (page layer, so it may combine features):

- calls `usePlacedOrders()` from `@/features/order`
- calls `useInstruments()` from `@/features/instruments` and builds `tickers` as a `Map` from its data (`useMemo` on the data reference). While instruments load, or if they fail, the map is empty and rows show the `#id` fallback. Instruments failing is not an error for this section.
- renders a `<section aria-labelledby>` with the same header style as Positions:
  - `<h2>` `orders.history.title`
  - count `orders.history.count` (pluralized)
- states, data first (as on the portfolio page):
  1. data with orders → table + cards
  2. data with no orders → `EmptyState` with `orders.history.empty.title` / `orders.history.empty.description`, no action
  3. error and not fetching → `ErrorState` with title `errors.unexpected`, description from `errorKey(error)`, retry → `refetch()`
  4. otherwise → `PlacedOrdersSkeleton`

`PortfolioPage` renders `<PlacedOrdersSection />` after its existing content, **in every portfolio state** (loading, error, empty, data). The section loads and fails on its own.

Move the page's `errorKey` function into `src/pages/portfolio/errorKey.ts` so `PortfolioPage` and `PlacedOrdersSection` share it. Spec 08 may still merge it with the instruments page's copy.

## 9. i18n

Add a `history` block to the `orders` namespace.

### `en/orders.ts`

```ts
history: {
  title: 'Placed orders',
  count_one: '{{count}} order',
  count_other: '{{count}} orders',
  caption: 'Orders you have placed, newest first',
  unknownInstrument: '#{{id}}',
  columns: {
    date: 'Date',
    instrument: 'Instrument',
    side: 'Side',
    type: 'Type',
    quantity: 'Quantity',
    price: 'Price',
    total: 'Total',
    status: 'Status',
  },
  empty: {
    title: 'No orders yet',
    description: 'Orders you place will appear here.',
  },
},
```

### `es/orders.ts`

```ts
history: {
  title: 'Órdenes enviadas',
  count_one: '{{count}} orden',
  count_other: '{{count}} órdenes',
  caption: 'Órdenes que enviaste, de la más reciente a la más antigua',
  unknownInstrument: '#{{id}}',
  columns: {
    date: 'Fecha',
    instrument: 'Instrumento',
    side: 'Lado',
    type: 'Tipo',
    quantity: 'Cantidad',
    price: 'Precio',
    total: 'Total',
    status: 'Estado',
  },
  empty: {
    title: 'Todavía no enviaste órdenes',
    description: 'Las órdenes que envíes van a aparecer acá.',
  },
},
```

## 10. Test infrastructure

- `src/test/fixtures/orders.ts`: add `placedOrdersFixture`, three orders **in API order (oldest first)**, mirroring the live sample: a REJECTED LIMIT BUY, a FILLED MARKET BUY and a FILLED MARKET SELL, on instruments that exist in `instrumentsFixture` (ids 1 and 2). Keep the existing fixtures.
- `src/test/msw/handlers.ts`: add `GET /orders` returning `placedOrdersFixture`, behind `headerError` like the others.
- `src/test/msw/handlers.test.ts`: `GET /orders` rejects missing headers and returns the fixture.

## 11. Tests

### `src/entities/order/model/metrics.test.ts`

- `orderTotal`: normal value, rounding to cents, non-finite quantity or price → `null`
- `compareNewestFirst`: newer first, tie broken by higher id, invalid date last

### `src/shared/lib/format.test.ts`

- `formatDateTime` in EN and ES (UTC)
- invalid string, `null`, `undefined` → `null`

### `src/pages/portfolio/placedOrders.test.tsx`

Render `PortfolioPage` with `renderWithProviders`. Scope queries to the "Placed orders" section (`getByRole('region', { name: 'Placed orders' })`) and then to its table or cards.

1. rows are newest first (fixture is oldest first)
2. each row shows date, ticker, translated side and type, quantity, price, total and status label + raw code
3. an `instrument_id` missing from instruments shows `#<id>`
4. instruments failing (`500`) still renders the orders with `#<id>`
5. loading renders the skeleton
6. error renders `ErrorState`; retry refetches and then shows the rows
7. empty list renders the empty state
8. the section still renders when the portfolio request fails
9. mobile cards show the same values
10. ES copy and formatting (`{ lang: 'es' }`)

### `src/features/order/orderModal.test.tsx`

Extend the invalidation test: after a successful order, `invalidateQueries` is called with `queryKeys.orders` as well as `queryKeys.portfolio`.

Existing portfolio tests must keep passing unchanged. If a query now matches both a position and an order, scope the new tests, not the old ones.

## 12. Styling

- Same section header, table and card look as Positions (reuse the patterns in `PositionsTable.module.scss` / `PositionsCards.module.scss`; copying a few rules is fine, importing another feature's styles is not).
- Space between the Positions section and this section matches the space above Positions.
- Date and numbers use tabular numbers; the date column does not wrap on desktop.
- No horizontal overflow at 375 px. On desktop, if eight columns do not fit at 768 px, let the table container scroll horizontally inside itself rather than the page.

## 13. Acceptance criteria

- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run api:types:check` pass.
- `/portfolio` shows "Placed orders" below Positions, newest first, with ticker, side, type, quantity, price, total, status and date.
- Placing an order from the modal refreshes the list without reloading the page.
- The section's loading, error and empty states do not block the summary or positions, and the reverse.
- EN/ES parity passes; dates follow the UI language.
- No feature-to-feature imports: only `PlacedOrdersSection` (page layer) combines `features/order` and `features/instruments`.

## 14. Out of scope

- Pagination, sorting controls, filtering, search
- Order detail view, cancel or modify
- Showing orders on any page other than `/portfolio`
- Polling or live updates of PENDING orders

## 15. Agent notes

- Branch `spec/07-placed-orders` from `main` after spec 06 is merged.
- Load the `react-best-practices` skill first.
- `OrderStatusBadge` already exists in `src/features/order/ui/` (spec 06); reuse it, do not copy it.
- Use `entities/order` for the total and the sort; do not compute them in components.
- Run `npm run format` after creating files.
