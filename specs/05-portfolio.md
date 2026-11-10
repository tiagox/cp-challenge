# Spec 05 — Portfolio

| | |
|---|---|
| **Status** | Ready |
| **Depends on** | [02 — App shell, theme & i18n](./02-app-shell-theme-i18n.md) |
| **Owns** | Portfolio feature, portfolio page, `portfolio` i18n namespace |

## 1. Goal

Implement the portfolio screen:

- fetch `GET /portfolio`
- show cash, total market value, total P&L and total return
- show each position with ticker, quantity, market value, P&L and return
- open the order modal in SELL mode with the position quantity preset
- handle loading, error and empty states
- be responsive and fully localized in EN/ES

## 2. Files owned

Create or replace only:

```text
src/features/portfolio/api.ts
src/features/portfolio/queries.ts
src/features/portfolio/index.ts
src/features/portfolio/ui/PortfolioSummary.tsx
src/features/portfolio/ui/PortfolioSummary.module.scss
src/features/portfolio/ui/PositionsTable.tsx
src/features/portfolio/ui/PositionsTable.module.scss
src/features/portfolio/ui/PositionsCards.tsx
src/features/portfolio/ui/PositionsCards.module.scss
src/features/portfolio/ui/PortfolioSkeleton.tsx
src/features/portfolio/ui/PortfolioSkeleton.module.scss
src/features/portfolio/ui/portfolio.module.scss

src/pages/portfolio/PortfolioPage.tsx
src/pages/portfolio/PortfolioPage.module.scss

src/shared/i18n/locales/en/portfolio.ts
src/shared/i18n/locales/es/portfolio.ts

src/features/portfolio/portfolio.test.tsx
```

Do not modify the router, layout, shared UI, API client, order context or other feature folders.

## 3. Data layer

### `api.ts`

```ts
import { http } from '@/shared/api/http'
import type { Portfolio } from '@/entities/position/model/types'

export async function getPortfolio(signal?: AbortSignal): Promise<Portfolio> {
  return http.get<Portfolio>('/portfolio', { signal })
}
```

### `queries.ts`

```ts
export function usePortfolio() {
  return useQuery({
    queryKey: queryKeys.portfolio,
    queryFn: ({ signal }) => getPortfolio(signal),
    staleTime: 30_000,
  })
}
```

Use `queryKeys` from `shared/api/queryKeys.ts`.

### `index.ts`

Export the hook and the UI components needed by the page.

## 4. Metrics

Use `entities/position` metrics. Do not reimplement formulas.

For each holding:

```text
market value = marketValue(quantity, last_price)
P&L ($)      = profitLoss(quantity, last_price, avg_cost_price)
return %     = returnOnCost(last_price, avg_cost_price)
```

For the portfolio:

```text
aggregatePortfolio(holdings)
```

Summary cards:

| Card | Value |
|---|---|
| Available cash | `portfolio.cash` |
| Market value | aggregate market value |
| Total P&L | aggregate profit loss |
| Total return | aggregate return % |

Rules:

- Invalid ratios render `—`.
- Zero cost basis returns `null` for return, not `Infinity`.
- P&L uses `MoneyText` with `tone="positive"` when `>= 0`, otherwise `tone="negative"`.
- Return uses `PercentText` with `tone="auto"`.

## 5. Page behavior

`PortfolioPage`:

- calls `usePortfolio()`
- calls `useOrderTicket()` from `features/order`
- renders `PageHeader` with `portfolio.title` and `portfolio.description`
- renders `PortfolioSummary` when data is available
- renders positions table on desktop and cards on mobile
- section header includes `portfolio.positions.title` and pluralized count
- on position select:
  ```ts
  open({
    instrument: {
      id: holding.instrument_id,
      ticker: holding.ticker,
      last_price: holding.last_price,
    },
    side: 'SELL',
    quantity: holding.quantity,
  })
  ```

### Desktop

Breakpoint `>= 768px`: semantic table with columns:

| Column | Content |
|---|---|
| Ticker | ticker |
| Quantity | integer, tabular numbers |
| Market value | `MoneyText` |
| P&L | `MoneyText` with tone |
| Return | `PercentText` with auto tone |
| Action | “Sell” button |

- Table has a visually hidden `<caption>`.
- Row click opens the order ticket (pointer convenience).
- The visible “Sell” button is the keyboard-accessible trigger.
- Stop propagation on the button.

### Mobile

Below `768px`: card list. Each card shows:

- ticker
- quantity
- market value
- P&L
- return
- full-width “Sell” button

Cards are `<article>` elements; the button is the accessible trigger.

## 6. States

### Loading

- 4 summary card skeletons
- 4 position row/card skeletons
- no layout jump when data arrives
- visually hidden `common.loading`

### Error

Use `ErrorState`:

- `errors.unexpected`
- `errors.network` / `errors.timeout` / `errors.server` based on `ApiError`
- retry calls `refetch()`

### Empty

When `holdings.length === 0`:

- still show the summary cards (cash is available)
- `EmptyState`:
  - title `portfolio.empty.title`
  - description `portfolio.empty.description`
  - action: `Link` to `/instruments` with `portfolio.empty.action`

## 7. i18n namespace

### `en/portfolio.ts`

```ts
export const portfolio = {
  title: 'Portfolio',
  description: 'Track your positions and performance.',
  summary: {
    cash: 'Available cash',
    marketValue: 'Market value',
    profitLoss: 'Total P&L',
    return: 'Total return',
  },
  positions: {
    title: 'Positions',
    count_one: '{{count}} position',
    count_other: '{{count}} positions',
  },
  columns: {
    ticker: 'Ticker',
    quantity: 'Quantity',
    marketValue: 'Market value',
    profitLoss: 'P&L',
    return: 'Return',
    action: 'Action',
  },
  actions: {
    sell: 'Sell',
    sellTicker: 'Sell {{ticker}}',
  },
  empty: {
    title: 'No positions yet',
    description: 'Buy your first instrument to start building your portfolio.',
    action: 'Browse instruments',
  },
}
```

### `es/portfolio.ts`

```ts
export const portfolio = {
  title: 'Portafolio',
  description: 'Seguí tus posiciones y su rendimiento.',
  summary: {
    cash: 'Efectivo disponible',
    marketValue: 'Valor de mercado',
    profitLoss: 'Ganancia total',
    return: 'Rendimiento total',
  },
  positions: {
    title: 'Posiciones',
    count_one: '{{count}} posición',
    count_other: '{{count}} posiciones',
  },
  columns: {
    ticker: 'Ticker',
    quantity: 'Cantidad',
    marketValue: 'Valor de mercado',
    profitLoss: 'Ganancia',
    return: 'Rendimiento',
    action: 'Acción',
  },
  actions: {
    sell: 'Vender',
    sellTicker: 'Vender {{ticker}}',
  },
  empty: {
    title: 'Todavía no tenés posiciones',
    description: 'Comprá tu primer instrumento para empezar a construir tu portafolio.',
    action: 'Ver instrumentos',
  },
}
```

The ES file must satisfy the EN namespace type via the top-level parity check.

## 8. Styling

- Summary uses a responsive grid: 1 column mobile, 2 columns tablet, 4 columns desktop.
- Summary cards use `Card` surface tokens.
- P&L and return use positive/negative tokens.
- Numeric columns use tabular numbers and right alignment.
- Ticker is prominent.
- Mobile cards are comfortable touch targets (>= 44px).
- No horizontal overflow at 375 px.
- Empty state is centered with a clear CTA.

## 9. Tests

Create `src/features/portfolio/portfolio.test.tsx`.

Required tests:

1. renders summary values from fixtures
2. renders position ticker, quantity, market value, P&L and return
3. positive and negative P&L/return use the correct tones
4. invalid/zero average cost renders `—` for return
5. EN copy renders by default
6. ES copy renders after `i18n.changeLanguage('es')`
7. loading state renders skeletons
8. error state renders retry and calls `refetch`
9. empty holdings renders the empty state and CTA link to `/instruments`
10. clicking “Sell” opens the order ticket with `side: 'SELL'` and `quantity` equal to the holding quantity

For the order-ticket assertion, render a small test consumer inside the same `OrderTicketProvider` that reads `useOrderTicket().state` and prints it.

Use MSW `server.use` to override portfolio responses.

## 10. Acceptance criteria

- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass.
- Market value, P&L and return match the formulas in `entities/position`.
- Clicking a position opens SELL with the full holding quantity preset.
- Empty portfolio still shows cash.
- EN/ES parity passes.
- No overflow at 375 / 768 / 1280 px.
- Loading, error and empty states are implemented.

## 11. Out of scope

- Editing positions
- Order history
- Charts or allocation breakdowns
- Order form/modal implementation
- Portfolio refresh controls beyond retry

## 12. Agent notes

- Do not edit `specs/03`, `04` or `06` files.
- Import `useOrderTicket` from `@/features/order`.
- Use `entities/position` metrics; do not duplicate formulas.
- Portfolio query invalidation after orders is handled by spec 06; do not add it here.
- Run `npm run format` after creating files.
