# Spec 04 — Search

| | |
|---|---|
| **Status** | Ready |
| **Depends on** | [02 — App shell, theme & i18n](./02-app-shell-theme-i18n.md) |
| **Owns** | Search feature, search page, `search` i18n namespace |
| **Can run in parallel with** | 03, 05 |

## 1. Goal

Implement a debounced instrument search by ticker:

- input synced with the URL (`?q=`)
- `GET /search?query=`
- results show ticker, name, last price and return
- clicking a result opens the order modal in BUY mode
- loading, idle, empty and error states
- fully localized EN/ES

## 2. Files owned

Create or replace only:

```text
src/features/search/api.ts
src/features/search/queries.ts
src/features/search/index.ts
src/features/search/ui/SearchInput.tsx
src/features/search/ui/SearchInput.module.scss
src/features/search/ui/SearchResults.tsx
src/features/search/ui/SearchResults.module.scss
src/features/search/ui/SearchSkeleton.tsx
src/features/search/ui/SearchSkeleton.module.scss
src/features/search/ui/search.module.scss

src/pages/search/SearchPage.tsx
src/pages/search/SearchPage.module.scss

src/shared/i18n/locales/en/search.ts
src/shared/i18n/locales/es/search.ts

src/features/search/search.test.tsx
```

Do not modify the router, layout, shared UI, API client, order context or other feature folders.

## 3. Data layer

### `api.ts`

```ts
import { http } from '@/shared/api/http'
import type { Instrument } from '@/entities/instrument/model/types'

export async function searchInstruments(
  query: string,
  signal?: AbortSignal,
): Promise<Instrument[]> {
  const encoded = encodeURIComponent(query)
  return http.get<Instrument[]>(`/search?query=${encoded}`, { signal })
}
```

### `queries.ts`

```ts
export function useSearchInstruments(query: string) {
  const normalized = query.trim()

  return useQuery({
    queryKey: queryKeys.search(normalized),
    queryFn: ({ signal }) => searchInstruments(normalized, signal),
    enabled: normalized.length >= 1,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}
```

Use `keepPreviousData` from `@tanstack/react-query`.

## 4. Search page behavior

`SearchPage`:

- reads and writes the `q` search param with `useSearchParams`
- local input state initialized from `?q=`
- debounces input by `300ms` using `useDebouncedValue`
- updates the URL with `{ replace: true }` after debounce:
  - non-empty → `?q=<value>`
  - empty → no `q` param
- syncs the input from the URL on back/forward navigation without creating update loops
- calls `useSearchInstruments(debouncedQuery)`
- calls `useOrderTicket()`
- renders `PageHeader` with `search.title` and `search.description`
- on result select:
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

### Input

`SearchInput`:

- controlled `value` + `onChange`
- label `search.input.label`
- placeholder `search.input.placeholder`
- `type="search"`
- `inputMode="search"`
- `autoFocus` on mount
- clear button when non-empty:
  - `aria-label` = `search.input.clear`
  - clears input, URL and results
- search icon from lucide
- no hardcoded copy

### Results

`SearchResults`:

- only rendered when the query is non-empty and there are results
- shows a `role="status"` count using `search.results` plural keys
- semantic list (`<ul>` / `<li>`)
- each result shows:
  - ticker
  - type badge (reuse `Badge`; map `ACCIONES`/`MONEDA` with `search.type.*`)
  - name
  - last price (`MoneyText`)
  - return (`PercentText`, `tone="auto"`)
  - “Trade” button with accessible name `search.actions.tradeTicker`
- clicking the item or the button opens the order ticket in BUY mode
- keyboard access through the button
- responsive: single column on mobile, multi-column grid on desktop
- no horizontal overflow at 375 px

### Return calculation

Use `returnPercent(last_price, close_price)` from `entities/instrument`. Never duplicate the formula. Invalid values render `—`.

## 5. States

### Idle

When the trimmed query is empty:

- search icon
- title `search.idle.title`
- description `search.idle.description`
- no API request

### Loading

- show 3–4 skeleton result cards
- keep previous results while fetching a new query (`keepPreviousData`)
- do not clear the input
- show a visually hidden loading status

### Empty

When the query is non-empty and the API returns `[]`:

- title `search.empty.title`
- description `search.empty.description` with `{ query }`
- optional clear action using `search.input.clear`

### Error

Use `ErrorState`:

- `errors.unexpected` / `errors.network` / `errors.timeout` / `errors.server`
- retry calls `refetch()`
- input remains usable

## 6. i18n namespace

### `en/search.ts`

```ts
export const search = {
  title: 'Search',
  description: 'Find instruments by ticker.',
  input: {
    label: 'Ticker',
    placeholder: 'Search by ticker, e.g. DYCA',
    clear: 'Clear search',
  },
  idle: {
    title: 'Search for an instrument',
    description: 'Enter a ticker to see matching instruments.',
  },
  results_one: '{{count}} result',
  results_other: '{{count}} results',
  empty: {
    title: 'No instruments found',
    description: 'No results for “{{query}}”. Try another ticker.',
  },
  type: {
    ACCIONES: 'Stocks',
    MONEDA: 'Currency',
  },
  actions: {
    trade: 'Trade',
    tradeTicker: 'Trade {{ticker}}',
  },
}
```

### `es/search.ts`

```ts
export const search = {
  title: 'Buscar',
  description: 'Encontrá instrumentos por ticker.',
  input: {
    label: 'Ticker',
    placeholder: 'Buscá por ticker, ej. DYCA',
    clear: 'Limpiar búsqueda',
  },
  idle: {
    title: 'Buscá un instrumento',
    description: 'Ingresá un ticker para ver los instrumentos coincidentes.',
  },
  results_one: '{{count}} resultado',
  results_other: '{{count}} resultados',
  empty: {
    title: 'No se encontraron instrumentos',
    description: 'No hay resultados para “{{query}}”. Probá con otro ticker.',
  },
  type: {
    ACCIONES: 'Acciones',
    MONEDA: 'Moneda',
  },
  actions: {
    trade: 'Operar',
    tradeTicker: 'Operar {{ticker}}',
  },
}
```

The ES file must satisfy the EN namespace type via the top-level parity check.

## 7. Styling

- Search input is prominent, full width, with a search icon.
- Results use `Card`-like surfaces or list rows with dividers.
- Numeric values use tabular numbers.
- Count sits above results, muted.
- Mobile: single column, comfortable touch targets (>= 44px).
- Desktop: 2-column grid if it does not hurt readability; otherwise one column with wider rows. Pick one and keep it consistent.
- No horizontal scroll at 375 px.
- Fetching a new query must not cause layout jumps; keep previous results visible.

## 8. Tests

Create `src/features/search/search.test.tsx`.

Required tests:

1. idle state when the input is empty; no request is made
2. typing one character triggers a debounced request
3. debounce: multiple rapid keystrokes produce one request for the final value
4. URL is updated with `?q=` after debounce
5. initial `?q=` value populates the input and triggers a request
6. back/forward URL changes sync the input
7. results render ticker, name, formatted price and return
8. count uses singular/plural copy
9. empty state renders the query in the description
10. error state renders retry and calls `refetch`
11. clicking a result opens the order ticket with `side: 'BUY'` and the correct instrument
12. clear button clears input, URL and results
13. EN/ES copy switches correctly

For the order-ticket assertion, render a small test consumer inside the same `OrderTicketProvider` that reads `useOrderTicket().state` and prints it.

Use MSW to assert the `query` parameter and return filtered fixtures.

## 9. Acceptance criteria

- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass.
- Search is debounced and does not fire for empty input.
- URL is shareable and back/forward works.
- Results open the order ticket in BUY mode.
- Return values match `entities/instrument` metrics.
- All copy comes from `search.*` / `common.*` / `errors.*`.
- EN/ES parity passes.
- No overflow at 375 px.
- Loading, idle, empty and error states are implemented.

## 10. Out of scope

- Searching by name (server searches ticker)
- Filters, sorting, pagination
- Search history
- Order form/modal implementation

## 11. Agent notes

- Do not edit `specs/03`, `05` or `06` files.
- Import `useOrderTicket` from `@/features/order`.
- Use `useDebouncedValue` from `shared/lib/hooks`.
- Keep the URL as the canonical query after debounce; avoid update loops with a ref or functional comparison.
- Use `placeholderData: keepPreviousData`; do not show a full-page loader between queries.
- Run `npm run format` after creating files.
