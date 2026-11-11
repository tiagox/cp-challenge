# Spec 03 — Instruments

| | |
|---|---|
| **Status** | Ready |
| **Depends on** | [02 — App shell, theme & i18n](./02-app-shell-theme-i18n.md) |
| **Owns** | Instruments feature, instruments page, `instruments` i18n namespace |

## 1. Goal

Implement the instruments screen:

- fetch `GET /instruments`
- show ticker, name, last price and return
- open the order modal in BUY mode when an instrument is selected
- handle loading, error and empty states
- be responsive and fully localized in EN/ES

## 2. Files owned

Create or replace only:

```text
src/features/instruments/api.ts
src/features/instruments/queries.ts
src/features/instruments/index.ts
src/features/instruments/ui/InstrumentTypeBadge.tsx
src/features/instruments/ui/InstrumentTypeBadge.module.scss
src/features/instruments/ui/InstrumentsTable.tsx
src/features/instruments/ui/InstrumentsTable.module.scss
src/features/instruments/ui/InstrumentsCards.tsx
src/features/instruments/ui/InstrumentsCards.module.scss
src/features/instruments/ui/InstrumentsSkeleton.tsx
src/features/instruments/ui/InstrumentsSkeleton.module.scss
src/features/instruments/ui/instruments.module.scss

src/pages/instruments/InstrumentsPage.tsx
src/pages/instruments/InstrumentsPage.module.scss

src/shared/i18n/locales/en/instruments.ts
src/shared/i18n/locales/es/instruments.ts

src/features/instruments/instruments.test.tsx
```

Do not modify the router, layout, shared UI, API client, order context or other feature folders.

## 3. Data layer

### `api.ts`

```ts
import { http } from '@/shared/api/http'
import type { Instrument } from '@/entities/instrument/model/types'

export async function getInstruments(signal?: AbortSignal): Promise<Instrument[]> {
  return http.get<Instrument[]>('/instruments', { signal })
}
```

### `queries.ts`

```ts
export function useInstruments() {
  return useQuery({
    queryKey: queryKeys.instruments,
    queryFn: ({ signal }) => getInstruments(signal),
    staleTime: 60_000,
  })
}
```

Use `queryKeys` from `shared/api/queryKeys.ts`.

### `index.ts`

Export the hook and UI components needed by the page. Keep internals private where possible.

## 4. Page behavior

`InstrumentsPage`:

- calls `useInstruments()`
- calls `useOrderTicket()` from `features/order`
- renders `PageHeader` with:
  - title `instruments.title`
  - description `instruments.description`
  - count `instruments.count` using the pluralization keys
- on instrument select:
  ```ts
  open({
    instrument: {
      id: instrument.id,
      ticker: instrument.ticker,
      name: instrument.name,
      last_price: instrument.last_price,
    },
    side: 'BUY',
  })
  ```

### Presentational list components

`InstrumentsTable`, `InstrumentsCards` and `InstrumentsSkeleton` do not fetch. The table and cards take `instruments: Instrument[]` and `onSelect: (instrument: Instrument) => void` as props, and the page passes the data in. Export them from `features/instruments/index.ts`: spec 04 reuses them to render search results on this page.

### Desktop

Breakpoint `>= 768px`: semantic table with columns:

| Column | Content |
|---|---|
| Ticker | ticker + `InstrumentTypeBadge` |
| Name | instrument name |
| Last price | `MoneyText` |
| Return | `PercentText` with `tone="auto"` |
| Action | “Trade” button |

- Table has a visually hidden `<caption>` with the page title.
- Clicking a row opens the order ticket (pointer convenience).
- The visible “Trade” button is the keyboard-accessible trigger.
- Stop propagation on the button so it does not double-fire.
- Rows have hover/focus-within styles.

### Mobile

Below `768px`: card list. Each card shows:

- ticker + type badge
- name
- last price
- return
- full-width “Trade” button

Cards are `<article>` elements; the button is the accessible trigger. The whole card may be clickable for pointer convenience.

### Return calculation

Use `returnPercent(last_price, close_price)` from `entities/instrument`.

- positive: green + `+`
- negative: red + `-`
- zero: neutral
- invalid (`close_price <= 0` or non-finite): render `—`

`PercentText` already handles the sign and tone. Pass `tone="auto"`.

### Type badge

`InstrumentTypeBadge` maps:

- `ACCIONES` → `instruments.type.ACCIONES`
- `MONEDA` → `instruments.type.MONEDA`

Use `Badge` with `variant="neutral"` for stocks and `variant="info"` for currency (or a sensible equivalent).

## 5. States

### Loading

- desktop: 6 skeleton rows using `Skeleton`
- mobile: 4 skeleton cards
- no layout jump when data arrives
- show a visually hidden `common.loading` status

### Error

Use `ErrorState` with:

- title `errors.unexpected`
- description `errors.network` if `ApiError.code === 'NETWORK'`, `errors.timeout` if `TIMEOUT`, otherwise `errors.server`
- retry action calling `refetch()`

### Empty

Use `EmptyState`:

- title `instruments.empty.title`
- description `instruments.empty.description`

## 6. i18n namespace

Fill both files. Use this exact copy.

### `en/instruments.ts`

```ts
export const instruments = {
  title: 'Instruments',
  description: 'Browse available instruments and place a market or limit order.',
  count_one: '{{count}} instrument',
  count_other: '{{count}} instruments',
  columns: {
    ticker: 'Ticker',
    name: 'Name',
    lastPrice: 'Last price',
    return: 'Return',
    action: 'Action',
  },
  type: {
    ACCIONES: 'Stocks',
    MONEDA: 'Currency',
  },
  actions: {
    trade: 'Trade',
  },
  empty: {
    title: 'No instruments available',
    description: 'Please try again later.',
  },
}
```

### `es/instruments.ts`

```ts
export const instruments = {
  title: 'Instrumentos',
  description: 'Explorá los instrumentos disponibles y enviá una orden de mercado o límite.',
  count_one: '{{count}} instrumento',
  count_other: '{{count}} instrumentos',
  columns: {
    ticker: 'Ticker',
    name: 'Nombre',
    lastPrice: 'Último precio',
    return: 'Retorno',
    action: 'Acción',
  },
  type: {
    ACCIONES: 'Acciones',
    MONEDA: 'Moneda',
  },
  actions: {
    trade: 'Operar',
  },
  empty: {
    title: 'No hay instrumentos disponibles',
    description: 'Intentá de nuevo más tarde.',
  },
} 
```

The ES file must end with `satisfies typeof enInstruments` or be checked by the top-level `es satisfies typeof en` parity.

## 7. Styling

- Use CSS Modules and tokens.
- Desktop table: sticky header, row dividers, right-aligned numeric columns.
- Numeric columns use tabular numbers (`font-variant-numeric: tabular-nums`).
- Ticker is prominent; name is muted.
- Mobile cards use `Card` surface styling or equivalent tokens.
- No horizontal overflow at 375 px.
- Ensure touch targets are at least 44px tall on mobile.

## 8. Tests

Create `src/features/instruments/instruments.test.tsx`.

Use `renderWithProviders` and MSW handlers.

Required tests:

1. renders all fixture instruments on desktop
2. shows ticker, name, formatted last price and return
3. renders positive, negative, zero and invalid returns correctly
4. renders the type badge labels in EN
5. renders ES copy after `i18n.changeLanguage('es')`
6. loading state renders skeletons
7. error state renders retry and calls `refetch` on click
8. empty state renders when the API returns `[]`
9. clicking “Trade” opens the order ticket with `side: 'BUY'` and the correct instrument
10. the table has a visually hidden caption

For the order-ticket assertion, render a small test consumer inside the same `OrderTicketProvider` that reads `useOrderTicket().state` and prints it.

Mock/override handlers with `server.use(http.get(...))`.

## 9. Acceptance criteria

- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass.
- Instruments list renders at 375, 768 and 1280 px without overflow.
- Clicking a row or “Trade” opens the order ticket in BUY mode.
- Return values match `(last_price - close_price) / close_price * 100`.
- Invalid returns render `—`, never `NaN`/`Infinity`.
- All copy comes from `instruments.*` / `common.*`; no hardcoded UI strings.
- EN and ES keys match.
- Loading, error and empty states are implemented.

## 10. Out of scope

- Search box on the instruments page (spec 04 adds it)
- Order form/modal implementation
- Portfolio data
- Sorting or filtering controls
- Charts

## 11. Agent notes

- Do not edit `specs/04`–`06` files.
- Import `useOrderTicket` from `@/features/order`, not from internal files.
- Use `entities/instrument` metrics; do not duplicate the return formula.
- Keep the page thin: data + layout only.
- Run `npm run format` after creating files.
