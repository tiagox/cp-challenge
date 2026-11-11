# Spec 04 — Instrument search

| | |
|---|---|
| **Status** | Ready |
| **Depends on** | [03 — Instruments](./03-instruments.md) |
| **Owns** | Search feature (API, query, input), search box on the instruments page, `search` i18n namespace |

## 1. Goal

Add a debounced ticker search box to the instruments page. There is no separate search screen or route.

- the search box sits above the instruments list
- empty box → the full `GET /instruments` list (spec 03 behavior)
- non-empty box → `GET /search?query=` results, rendered with the same table (desktop) and cards (mobile)
- the query is synced with the URL (`/instruments?q=`)
- selecting a result opens the order modal in BUY mode, exactly like a listed instrument
- loading, empty and error states for the search
- fully localized EN/ES

Decision record: `../sessions/05-search-in-instruments.md`.

## 2. Files owned

Create or replace only:

```text
src/features/search/api.ts
src/features/search/queries.ts
src/features/search/index.ts
src/features/search/ui/SearchInput.tsx
src/features/search/ui/SearchInput.module.scss
src/features/search/search.test.tsx

src/pages/instruments/InstrumentsPage.tsx          (extends spec 03's page)
src/pages/instruments/InstrumentsPage.module.scss  (extends spec 03's page)
src/pages/instruments/InstrumentsPage.test.tsx

src/shared/i18n/locales/en/search.ts
src/shared/i18n/locales/es/search.ts
```

Do not modify the router, layout, shared UI, API client, order context or other feature folders. Reuse spec 03's `InstrumentsTable`, `InstrumentsCards`, `InstrumentsSkeleton` through `@/features/instruments`; do not copy them. If a spec 03 component needs a small prop to support search, add it and say why in the PR.

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

### `index.ts`

Export `useSearchInstruments` and `SearchInput`. The search feature does not import the instruments feature; the page composes both.

## 4. Page behavior

`InstrumentsPage` (page layer, so it may compose `features/instruments`, `features/search` and `features/order`):

- reads and writes the `q` search param with `useSearchParams`
- local input state initialized from `?q=`
- debounces input by `300ms` using `useDebouncedValue`
- updates the URL with `{ replace: true }` after debounce:
  - non-empty → `?q=<value>`
  - empty → no `q` param
- syncs the input from the URL on back/forward navigation without creating update loops
- always calls `useInstruments()`; calls `useSearchInstruments(debouncedQuery)` (disabled when empty)
- chooses the active source:
  - trimmed debounced query empty → instruments query (all spec 03 states apply)
  - otherwise → search query and the search states below
- passes the active list to the same `InstrumentsTable` / `InstrumentsCards` and the same `onSelect` (BUY mode, spec 03 §4)
- `PageHeader` keeps `instruments.title` / `instruments.description`; while searching, the header count is replaced by the results status line below

### Input

`SearchInput`:

- controlled `value` + `onChange`
- visible label `search.input.label`
- placeholder `search.input.placeholder`
- `type="search"`, `inputMode="search"`, wrapped in `role="search"`
- no `autoFocus` (it is no longer a dedicated screen)
- clear button when non-empty:
  - `aria-label` = `search.input.clear`
  - clears input and URL, restoring the full list
- search icon from lucide
- full width on mobile, max ~640px on desktop

### Results status

- below the input, while the query is non-empty
- `role="status"` with `search.results` plural keys and the query: `4 results for “ar”`
- muted, small

### Return calculation

Results reuse spec 03 rendering, so return values come from `returnPercent` in `entities/instrument`. Never duplicate the formula.

## 5. States (query non-empty)

### Loading

- first search with no previous results: spec 03's `InstrumentsSkeleton`
- subsequent searches keep the previous results visible (`keepPreviousData`)
- do not clear the input
- visually hidden `common.loading` status

### Empty

When the API returns `[]`:

- `EmptyState` with title `search.empty.title` and description `search.empty.description` with `{ query }`
- action button `search.input.clear` that clears the search

### Error

Use `ErrorState`:

- `errors.unexpected` / `errors.network` / `errors.timeout` / `errors.server` (same mapping as spec 03)
- retry calls the search query's `refetch()`
- input remains usable

## 6. i18n namespace

### `en/search.ts`

```ts
export const search = {
  input: {
    label: 'Search by ticker',
    placeholder: 'e.g. DYCA',
    clear: 'Clear search',
  },
  results_one: '{{count}} result for “{{query}}”',
  results_other: '{{count}} results for “{{query}}”',
  empty: {
    title: 'No instruments found',
    description: 'No results for “{{query}}”. Try another ticker.',
  },
}
```

### `es/search.ts`

```ts
export const search = {
  input: {
    label: 'Buscar por ticker',
    placeholder: 'ej. DYCA',
    clear: 'Limpiar búsqueda',
  },
  results_one: '{{count}} resultado para “{{query}}”',
  results_other: '{{count}} resultados para “{{query}}”',
  empty: {
    title: 'No se encontraron instrumentos',
    description: 'No hay resultados para “{{query}}”. Probá con otro ticker.',
  },
}
```

The ES file must satisfy the EN namespace type via the top-level parity check.

## 7. Styling

- The search box sits between `PageHeader` and the list, with `--space-4` below it.
- Prominent input (≥ 48px tall), search icon inside, clear button ≥ 44px touch target.
- Status line is muted, `--text-sm`.
- Switching between full list and results must not cause layout jumps.
- No horizontal scroll at 375 px.

## 8. Tests

`src/features/search/search.test.tsx` (unit-level):

1. `SearchInput` renders the label and clear button only when non-empty
2. `useSearchInstruments` does not request for empty/whitespace input
3. MSW receives the encoded `query` parameter

`src/pages/instruments/InstrumentsPage.test.tsx` (page-level, with `OrderTicketProvider`):

1. empty box shows the full instruments list; no `/search` request
2. typing triggers one debounced request for the final value
3. URL gets `?q=` after debounce
4. initial `/instruments?q=dy` populates the input and shows filtered results
5. back/forward URL changes sync the input
6. results render ticker, name, formatted price and return in the table
7. status line uses singular/plural copy
8. empty state renders the query and its clear action restores the full list
9. error state renders retry and calls `refetch`
10. clicking “Trade” on a result opens the order ticket with `side: 'BUY'` and the correct instrument
11. clear button clears input and URL and restores the full list
12. ES copy renders with `{ lang: 'es' }`

For the order-ticket assertion, render a small test consumer inside the same `OrderTicketProvider` that reads `useOrderTicket().state` and prints it.

## 9. Acceptance criteria

- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass.
- There is no `/search` route or nav item.
- Search is debounced and never calls `/search` for empty input.
- `/instruments?q=` is shareable; back/forward works.
- Results use the same table/cards and open the order ticket in BUY mode.
- `features/search` does not import `features/instruments`.
- All copy comes from `search.*` / `instruments.*` / `common.*` / `errors.*`.
- EN/ES parity passes; no overflow at 375 px.

## 10. Out of scope

- A separate search page or route
- Searching by name (the server searches ticker)
- Client-side filtering of `/instruments` (the brief requires the `/search` endpoint)
- Filters, sorting, pagination, search history
- Order form/modal implementation

## 11. Agent notes

- Do not edit `specs/03`, `05` or `06` files.
- Import `useOrderTicket` from `@/features/order`.
- Use `useDebouncedValue` from `shared/lib/hooks`.
- Keep the URL as the canonical query after debounce; avoid update loops with a ref or functional comparison.
- Use `placeholderData: keepPreviousData`; do not show a full-page loader between queries.
- Run `npm run format` after creating files.
