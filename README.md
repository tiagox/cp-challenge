# CP Invest

A React app for the frontend challenge in [`frontend-challenge.md`](./frontend-challenge.md): browse instruments and their daily return, search them by ticker, follow a portfolio with its metrics and recent activity, and send market or limit orders, all against the challenge API. The UI is in Spanish by default, with English available, and has dark and light themes.

## Live demo

<!-- vercel-url -->

_Vercel link pending._ To try the production build locally:

```bash
npm run build
npm run preview   # http://localhost:4173
```

`vercel.json` rewrites every path to `index.html`, so deep links like `/portfolio` work after deploy.

## Tech stack

React 19 · TypeScript 5.9 · Vite 8 · React Router 7 · TanStack Query 5 · Sass + CSS Modules · i18next (ES/EN) · Radix Dialog · lucide-react · Vitest + Testing Library + MSW · `openapi-typescript`.

## Getting started

```bash
nvm use 22        # or any Node >= 22
npm ci
cp .env.example .env
npm run dev       # http://localhost:5173
```

## Environment variables

| Variable            | Default                              | Purpose                                                          |
| ------------------- | ------------------------------------ | ---------------------------------------------------------------- |
| `VITE_API_BASE_URL` | `https://dummy-api-topaz.vercel.app` | API origin. Trailing slashes are stripped                        |
| `VITE_CANDIDATE_ID` | empty                                | Optional fixed candidate key                                     |
| `VITE_API_BUG_MODE` | `off`                                | Sent as `X-Enable-Bugs`. Keep `off`; see [API notes](#api-notes) |

The candidate ID is optional. Without it, the app reuses `localStorage["cp.candidateId"]` or generates an anonymous UUID and stores it there. A new candidate starts with `{ cash: 1000000, holdings: [] }`, so a first visit shows an empty portfolio. Set `VITE_CANDIDATE_ID` to pin a candidate that already has holdings. The ID is never shown in the UI.

### Debug mode

Open any page with `?debug` to show a gray bug button in the bottom-right corner. It opens a small panel to change the `X-Enable-Bugs` mode (stored in `localStorage["cp.bugMode"]`, wins over `VITE_API_BUG_MODE`) and the candidate ID (`cp.candidateId`; disabled when `VITE_CANDIDATE_ID` is set). Every change refetches all data. `?debug=off` or "Turn off debug" hides it and resets the mode to `off`.

## Scripts

| Script                            | What it does                                      |
| --------------------------------- | ------------------------------------------------- |
| `npm run dev`                     | Start the Vite dev server                         |
| `npm run build`                   | Type-check and build to `dist/`                   |
| `npm run preview`                 | Serve the production build                        |
| `npm run lint` / `lint:fix`       | Run ESLint (and fix)                              |
| `npm run format` / `format:check` | Run Prettier (write / check)                      |
| `npm run typecheck`               | Type-check the app without emitting               |
| `npm run test` / `test:watch`     | Run Vitest once / in watch mode                   |
| `npm run test:coverage`           | Run tests with V8 coverage                        |
| `npm run api:types`               | Regenerate API types from `docs/api/openapi.yaml` |
| `npm run api:types:check`         | Fail if generated types are out of date           |

## API notes

Base URL: `https://dummy-api-topaz.vercel.app`. Every request goes through `src/shared/api/http.ts` and sends:

| Header           | Value                   | Why                                                          |
| ---------------- | ----------------------- | ------------------------------------------------------------ |
| `X-Enable-Bugs`  | `off`                   | Required on every endpoint; missing → `400`                  |
| `X-Candidate-Id` | anonymous candidate key | Required on `/portfolio` and `/orders`; scopes cash/holdings |

The brief mentions neither header. Other bug modes (`easy`, `medium`, `hard`) make the server corrupt responses on purpose; the product never exposes them.

Requests time out after 15 s. Queries retry once, and only for network errors or `5xx`. Order submissions never retry.

Contract and behavior notes: [`docs/api/openapi.yaml`](./docs/api/openapi.yaml) and [`docs/api/README.md`](./docs/api/README.md). Types in `src/shared/api/generated/` are generated from the OpenAPI file and never edited by hand.

## Architecture

Layers import only downwards:

```text
app → pages → features → entities → shared
```

- **app** — providers, router, layout, theme, and `OrderModalContainer` (the only place that composes two features: the order modal and `usePortfolio`).
- **pages** — thin route screens: `/instruments` (list + search box), `/portfolio` (summary, positions, activity), not-found.
- **features** — `instruments`, `search`, `portfolio`, `order`. Features never import each other.
- **entities** — domain types and the only copy of each formula.
- **shared** — HTTP client, query client, i18n, formatting, UI kit.

| State                                                             | Owner                                     |
| ----------------------------------------------------------------- | ----------------------------------------- |
| Instruments, portfolio, search results, placed orders, submission | TanStack Query                            |
| Order ticket (open, instrument, presets)                          | `OrderTicketProvider` (context + reducer) |
| Search query                                                      | URL (`/instruments?q=`)                   |
| Form values and validation                                        | Local component state                     |
| Theme / language                                                  | Providers + `localStorage` + boot script  |

```text
src/
  app/        providers, router, layout, styles, theme
  pages/      instruments, portfolio, not-found
  features/   instruments, search, portfolio, order
  entities/   instrument, position, order (types + metrics)
  shared/     api, i18n, lib, ui
  test/       render helpers, MSW handlers, fixtures, cross-feature tests
```

## Product behavior

- **Instruments** — ticker, name, type, last price and return `(last_price − close_price) / close_price × 100`. Each row has a Trade button.
- **Search** — a box on the instruments page. It matches tickers by substring, debounced, and keeps the query in `?q=` so refresh, back/forward and deep links work. An empty box shows the full list without calling `/search`.
- **Portfolio** — cash, market value (`quantity × last_price`), P&L (`(last_price − avg_cost_price) × quantity`) and return per position and in total. Each position has a Sell button that opens the ticket preset to the whole position. Below it, **Activity** lists placed orders newest first.
- **Order ticket** — BUY/SELL, MARKET/LIMIT. Quantity and amount are linked through the last price: typing a quantity sets `amount = round2(quantity × last_price)`; typing an amount sets `quantity = floor(amount / last_price)`. The field you typed in last wins. Shares are always whole numbers. LIMIT shows a price field, uses it for the estimated total and sends it as `price`; MARKET sends no price.
- **Validation** — BUY checks cash at the limit price (LIMIT) or the last price (MARKET); SELL checks the shares held. A last price of `0` disables submission with a message. Invalid submit focuses the first invalid field.
- **Result** — the modal stays open and shows the returned order id and status (translated label plus the raw code, e.g. `Filled FILLED`). Portfolio and orders are refetched after a successful order.
- **Rejections** — the brief describes rejections as a `REJECTED` status, but the API answers invalid orders with `400 { error }`. The app blocks invalid orders client-side and shows a server `400` as a localized rejection with no order id.

Invalid numbers (`0`, `null`, `NaN`, `Infinity` divisors) render as `—`.

## i18n

Spanish is the default and fallback; English is supported. The initial language is the stored `cp.lang`, then the first browser language starting with `es` or `en`, then `es`. Only an explicit switch is stored. Numbers and currency follow the UI language, not the browser locale: `ARS 1,234.56` / `+12.34%` in English, `$ 1.234,56` / `+12,34%` in Spanish. Known API error messages map to translated text.

## Theming

Dark and light themes are built on CSS custom properties. The initial theme is the stored `cp.theme`, then `prefers-color-scheme`, then light; the app follows system changes until you choose. An inline script in `index.html` sets `data-theme` and `lang` before React renders, so there is no flash of the wrong theme or language. `prefers-reduced-motion` turns off non-essential animation.

## Testing

```bash
npm run test
npm run test:coverage
```

- Unit tests for formulas, formatting, validation, linked fields, error mapping, config and the HTTP client.
- Feature tests for loading, error, empty, localized (EN and ES) and main interactions.
- MSW is the network boundary; its handlers reject requests that lack the required headers.
- `src/test/critical-flows.test.tsx` runs the real route tree: instruments → order, portfolio → sell, search → order, `400` rejection, LIMIT/PENDING, navigation and not-found.
- `src/test/persistence.test.tsx` covers stored language, theme and candidate; `src/test/error-boundary.test.tsx` covers the error fallback and retry.
- An EN/ES parity test keeps both translation sets in sync.

## Accessibility and responsiveness

Skip link to `#main`, semantic tables with captions and header scopes, `aria-current` on the active nav item, labelled controls with linked errors, `aria-live` order results, and a Radix dialog with focus trap, ESC and focus restore. The order flow works with the keyboard only. Signs (`+`/`−`) go with every positive or negative color. Below 768 px tables become cards, the nav moves to a bottom bar with safe-area padding, and the modal becomes a bottom sheet; there is no horizontal scroll at 375 px.

The manual pass is in [`docs/qa/manual-checklist.md`](./docs/qa/manual-checklist.md).

## Design decisions

- [`specs/README.md`](./specs/README.md) — stack, architecture, global rules, definition of done
- [`sessions/00-design-decisions.md`](./sessions/00-design-decisions.md) and later `sessions/` notes — why things are the way they are
- [`AGENTS.md`](./AGENTS.md) — rules for coding agents

## Known limitations

- Order activity is a plain list: no paging, filters, detail view or cancellation.
- No authentication; the candidate is anonymous and lives in `localStorage`. Clearing site data starts a new, empty portfolio.
- Server bug modes are not supported in the product.
- LIMIT orders are not simulated: they stay `PENDING` as the API returns them, and cannot be cancelled.
- Not verified: whether the live API lists orders rejected with `400` in `GET /orders`. The app refreshes the list only after a successful order.
