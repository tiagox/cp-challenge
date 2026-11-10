---
session: 00
date: 2026-11-10
agent: opencode
mode: plan
title: Design decisions for the Cocos frontend challenge
status: accepted
related_specs:
  - specs/README.md
  - specs/00-api-contract.md
  - specs/01-foundation.md
  - specs/02-app-shell-theme-i18n.md
  - specs/03-instruments.md
  - specs/04-search.md
  - specs/05-portfolio.md
  - specs/06-orders.md
  - specs/07-hardening-docs.md
---

# Session 00 — Design decisions

## 1. Context

The repository starts with only `frontend-challenge.md`. The goal is a responsive React/TypeScript application that consumes four endpoints:

- `GET /instruments`
- `GET /portfolio`
- `GET /search?query=`
- `POST /orders`

The brief asks for instruments, portfolio, a ticker search and an order modal with `BUY`/`SELL`, `MARKET`/`LIMIT`, exact share quantity or an investment amount, and display of the returned `id` and `status`.

This session produced implementation specs for coding agents. It did **not** implement the application. The spec set is the hand-off artifact for the build sessions.

The main risk was not the UI. It was the undocumented live API: required headers, candidate scoping, validation quirks and bug modes that deliberately corrupt data. Those behaviors had to be verified and written down before any code was generated.

## 2. API discoveries

The live base URL is `https://dummy-api-topaz.vercel.app`.

### Required headers

Every request must send:

```http
X-Enable-Bugs: off
X-Candidate-Id: <candidate key>
```

Findings:

- Missing `X-Enable-Bugs` returns `400 { "error": "X-Enable-Bugs must be off, easy, medium, or hard" }` even though the challenge brief does not mention the header.
- Missing `X-Candidate-Id` on `/portfolio` and `/orders` returns `400 { "error": "Missing X-Candidate-Id header" }`.
- CORS preflight allows both custom headers.
- The app always sends `off`. Other values intentionally corrupt prices, fills and consistency and are only useful for manual QA.

### Portfolio

- Shape: `{ cash: number, holdings: Holding[] }`.
- `Holding`: `{ instrument_id, ticker, quantity, last_price, close_price, avg_cost_price }`.
- A new candidate starts at `{ "cash": 1000000, "holdings": [] }`.
- `cash` and `holdings` are scoped by `X-Candidate-Id`; there is no login.

### Instruments

- 26 items.
- `type` is `ACCIONES` or `MONEDA`.
- Fields: `id`, `ticker`, `name`, `type`, `last_price`, `close_price`.
- The challenge asks for return, which is not returned; it must be calculated as `(last_price - close_price) / close_price * 100`.

### Search

- `query` matches ticker, case-insensitively, as a substring.
- Empty or missing query returns every instrument.
- The app only calls search with a non-empty, trimmed query.

### Orders

- Success is `201`, not `200`.
- Response is the full order:
  ```json
  {
    "id": 648128,
    "candidate_id": "test",
    "instrument_id": 1,
    "side": "BUY",
    "type": "MARKET",
    "quantity": 10,
    "price": 45.72,
    "status": "FILLED",
    "created_at": "2026-11-10T17:48:29.611Z"
  }
  ```
- Validation failures return `400 { "error": "..." }`, **not** a `201` order with `REJECTED`.
- Known messages:
  - `Insufficient cash`
  - `Insufficient shares`
  - `quantity must be a positive number`
  - `quantity must be a positive integer`
  - `LIMIT orders require a numeric price`
  - `Instrument not found`
  - `Missing X-Candidate-Id header`
- LIMIT BUY validates cash against the limit price.
- MARKET uses `last_price`.
- MARKET returns `FILLED` or `REJECTED`; LIMIT returns `PENDING` or `REJECTED`.

### Bug modes

`easy`, `medium` and `hard` intentionally produce bad data or behavior, for example `MIRG` with `last_price: 0` and inconsistent fills. The application must never expose these modes. The only supported value is `off`; `VITE_API_BUG_MODE` exists for manual QA only.

## 3. Stack decision

Final stack:

| Concern | Choice |
|---|---|
| Runtime | Node.js >= 22 |
| Package manager | npm |
| UI | React 19.3.x |
| Build | Vite 8.3.x |
| Language | TypeScript 5.9.3 (pinned) |
| Routing | React Router 7.18.x |
| Server state | TanStack Query 5.107.x |
| Client state | React context + `useReducer` |
| Styles | Sass 1.108.x + CSS Modules |
| Modal primitive | `@radix-ui/react-dialog` 1.3.x |
| Icons | `lucide-react` 1.71.x |
| i18n | `i18next` 27.1.x + `react-i18next` 18.0.x |
| HTTP | native `fetch` behind a typed client |
| Tests | Vitest 5.1.x, RTL 16.3.x, user-event 14.6.x, MSW 3.0.x |
| Lint/format | ESLint 10 + typescript-eslint 8 + Prettier 3 |
| API types | `openapi-typescript` 7.13.x |

### Why TanStack Query only

The brief allows Redux, React Query or both. Almost all state is server state: instruments, portfolio, search and order submission. TanStack Query covers caching, retries, invalidation and loading/error states with less ceremony than Redux.

The only meaningful client state is the order ticket (open/closed, selected instrument, preset side and quantity). A small context with `useReducer` is enough. Redux would add boilerplate and a second source of truth for data that already lives in the query cache.

### Why TypeScript 5.9.3

TypeScript 7 is not compatible with the current toolchain:

- `typescript-eslint` declares a peer range below `6.1.0`.
- `openapi-typescript` declares `^5.x`.

Pinning 5.9.3 keeps lint, typecheck and type generation stable.

## 4. Architecture

```text
app → pages → features → entities → shared
```

- `app` composes providers, router, layout and styles.
- `pages` are thin route screens; they call feature hooks and compose feature UI.
- `features` own use cases, API calls and feature UI.
- `entities` own domain types and pure calculations.
- `shared` owns generic infrastructure with no domain rules.

Features never import other features. Pages and app-level containers compose them. Concretely:

- The order feature exposes `OrderTicketProvider` and `useOrderTicket`.
- Instruments, search and portfolio pages call `open()` from the order feature.
- The order modal needs cash and holdings from the portfolio feature. The order feature must not import the portfolio feature, so `src/app/layout/OrderModalContainer.tsx` (app layer) calls `usePortfolio()` and passes cash, holdings, status and retry into `OrderModal` as props.

This keeps the dependency graph inside the rule and puts cross-feature composition where it belongs: `app` and `pages`.

Consequence for planning: spec 06 depends on spec 05’s public `usePortfolio` hook. Specs 03 and 04 remain independent, and 05 can run in parallel with 03/04. The earlier idea of running 03–06 fully in parallel was too optimistic and was corrected in `specs/README.md` and the spec headers.

## 5. State boundaries

| State | Owner |
|---|---|
| Instruments, portfolio, search, order submission | TanStack Query |
| Order ticket open/closed, selected instrument, presets | `OrderTicketProvider` |
| Search query | URL (`?q=`) |
| Form values and validation | Local component state |
| Theme | `ThemeProvider` + `localStorage` + boot script |
| Language | i18next + `localStorage` + boot script |

The search query lives in the URL so results are shareable and back/forward works. The debounced value drives the request; the URL is updated after debounce to avoid history noise.

## 6. API contract strategy

The API is undocumented beyond four curl examples. Guessing types would spread unverified assumptions through the app.

Decision:

1. Write `docs/api/openapi.yaml` as an OpenAPI 3.1 contract.
2. Write `docs/api/README.md` for behavior OpenAPI cannot express: headers, candidate semantics, bug modes, validation messages, CORS, verification date.
3. Generate TypeScript DTOs with `openapi-typescript` into `src/shared/api/generated/schema.ts`.
4. Re-export stable aliases from `src/shared/api/types.ts`.
5. Hand-write a small typed `fetch` client in `src/shared/api/http.ts` with headers, timeout, abort and `ApiError`.

Rejected:

- **Orval/full codegen** — generates hooks and clients that hide the API quirks and add a large dependency surface for four endpoints.
- **Hand-written types only** — drifts immediately and provides nothing executable to check.
- **Axios** — native `fetch` is sufficient; the client needs headers, timeout and error mapping, not interceptors.

Rules:

- No direct `fetch` outside `shared/api/http.ts`.
- `ApiError` is the only error type thrown by the client.
- Queries may retry once on network/5xx. Mutations never retry.
- Portfolio is invalidated after a successful order.

## 7. Candidate identity

The API needs `X-Candidate-Id`, but the app has no authentication and the challenge does not define a user identity.

Resolution order:

1. `VITE_CANDIDATE_ID` if non-empty
2. `localStorage["cp.candidateId"]` if non-empty
3. generated `crypto.randomUUID()` (with a timestamp/random fallback), persisted

The ID is an API session key only. It is never shown in the UI. This gives stable portfolio data across reloads and a clean slate for a new browser profile. Reviewers can pin a candidate through `.env` without code changes.

## 8. i18n

Decision: EN is the default and fallback; ES is fully supported.

Detection order:

1. stored `cp.lang`
2. browser language starting with `es` → `es`
3. `en`

Only an explicit language switch is persisted. A detected language is not written to storage, so a later browser-language change can still take effect until the user chooses.

Implementation:

- Bundled resources, initialized synchronously to avoid a language flash.
- One namespace file per feature (`instruments`, `portfolio`, `search`, `orders`, `validation`) so parallel feature specs never edit the same translation file.
- Type-safe resources: `es` is checked with `satisfies typeof en`.
- A parity test flattens both trees and compares key sets.
- All copy goes through `t()`, including `aria-label`, titles, empty states and errors.

Formatting follows the UI language, not the browser locale:

- EN: `ARS 1,234.56`, `+12.34%`, `1,234`
- ES: `$ 1.234,56`, `+12,34%`, `1.234`

API error messages are mapped to translation keys. Unknown messages fall back to a generic localized message. Order status badges show the translated label **and** the raw API code so reviewers can see the server value.

Rejected:

- Browser-locale formatting independent of UI language — confusing when the UI is Spanish but numbers are English.
- Storing the detected language — prevents browser preference from ever applying again.
- One giant translation file — creates merge conflicts across parallel feature work.

## 9. Theming

Decision: dark and light themes driven by CSS custom properties.

Resolution order:

1. stored `cp.theme`
2. `prefers-color-scheme`
3. fallback `dark`

Only an explicit toggle is persisted. An inline script in `index.html` sets `data-theme` and `lang` before the module script so there is no flash. React providers use the same rules and then take over updates.

Tokens cover background, surfaces, borders, text, accent, positive/negative, spacing, radii, typography, shadows and z-index. Both themes must pass contrast and focus checks.

Rejected:

- CSS-in-JS theme objects — extra runtime and a second styling system alongside Sass.
- Dark-only — the brief does not require both, but the design reference apps support both and it is cheap with tokens.

## 10. Order form

The brief allows entering exact shares or an investment amount. Both fields are shown and linked.

Rules:

- Editing **quantity** updates amount: `amount = round2(quantity * last_price)`.
- Editing **amount** updates quantity: `quantity = floor(amount / last_price)`.
- The last edited field wins; the other field is derived and never overwrites it.
- `limit_price` is independent and does not participate in the link.
- Shares are always positive integers. Fractions can never be submitted.
- The estimated total uses the effective price: limit price for LIMIT, last price for MARKET.
- LIMIT BUY validates cash against the limit price, matching server behavior.
- SELL validates against the holding quantity.
- MARKET BUY validates against cash at the last price.
- If `last_price <= 0`, the form shows an unavailable message and submit is disabled.
- The payload includes `price` only for LIMIT orders.

The modal stays open after submission so the user can read the result and start a new order. The result region uses `aria-live` because the id and status are the core output of the flow.

Rejected:

- Only one input mode — the brief explicitly asks for both exact shares and a cash amount.
- Letting the server reject avoidable errors — client validation gives faster feedback and still maps server errors.
- Closing the modal immediately after submit — the user would miss the returned id/status.

## 11. Testing strategy

Test pyramid:

- **Pure unit tests** for calculations: return %, market value, P&L, portfolio aggregation, linked fields, validation, error mapping, formatting, language resolution, theme resolution.
- **Component tests** with RTL for each feature: loading, error, empty, copy, interactions, order-ticket integration.
- **Integration tests** in spec 07 for critical flows across features: instruments → order, portfolio → sell, search → order, LIMIT vs MARKET, error path, navigation.
- **Static audits** for copy and API rules.

MSW is the network boundary. Handlers enforce the required headers so a missing header fails tests the same way it fails in production. `onUnhandledRequest: 'error'` prevents accidental real calls.

Not chosen:

- **Playwright/e2e** — valuable, but the challenge asks for unit tests and the spec set is already large. Critical paths are covered at the RTL level with the real providers.
- **Snapshot tests** — noisy and weak for behavior.
- **Testing generated API types** — they are checked by `tsc` and `api:types:check` instead.

## 12. Spec plan

The build is split so most work can be parallelized without merge conflicts:

| # | Spec | Purpose |
|---|---|---|
| 00 | API contract | OpenAPI, docs, generated types, HTTP client, minimal scaffold |
| 01 | Foundation | Final tooling, Sass tokens, i18n infrastructure, entities, shared lib, test infra |
| 02 | App shell | Providers, router, layout, theme, language switcher, UI kit, order-ticket context, stubs |
| 03 | Instruments | Feature, page, instruments namespace, tests |
| 04 | Search | Feature, page, URL/debounce, search namespace, tests |
| 05 | Portfolio | Feature, page, metrics UI, portfolio namespace, tests |
| 06 | Orders | Feature, modal, validation, mutation, app container, orders/validation namespaces, tests |
| 07 | Hardening | Cross-feature tests, audits, README, manual QA, final verification |

Each spec declares owned files, dependencies, contracts, numbered requirements, tests, acceptance criteria and out-of-scope items. Feature specs own one namespace each to avoid translation-file conflicts.

Dependency correction:

- 03, 04 and 05 depend only on 02 and run in parallel.
- 06 depends on 05 for `usePortfolio` and runs alongside 03/04 once that hook exists.
- 07 runs last.

## 13. Rejected alternatives

| Alternative | Why rejected |
|---|---|
| Redux Toolkit for all state | Server data duplicates the query cache; heavy for four endpoints |
| Orval or full OpenAPI codegen | Opaque generated hooks; hides quirks; large surface |
| Axios | No benefit over native `fetch` for this client |
| TypeScript 7 | Breaks typescript-eslint and openapi-typescript peer ranges |
| React 18 | React 19 is current and supported by the chosen libraries |
| CSS-in-JS | Sass is required by the brief; two styling systems add cost |
| One global i18n file | Merge conflicts across parallel feature specs |
| Browser-locale number formatting | Inconsistent with the selected UI language |
| Persisting detected language/theme | Prevents future browser preference from applying |
| Order feature importing portfolio feature | Violates layer rule; solved with app-layer container |
| Closing modal on submit | Hides the returned `id`/`status`, which the brief requires |
| Optimistic portfolio updates | Server may reject; invalidation is simpler and correct |
| Retrying order mutations | Duplicate orders are worse than a visible failure |
| Exposing bug modes in the UI | Not a product feature; risks corrupt data in a demo |

## 14. Open items

- **Contrast verification:** token pairs are chosen to be readable, but final contrast must be measured in both themes during spec 07. Adjust tokens if a pair fails.
- **Mobile bottom-sheet keyboard behavior:** needs a real-device or browser-emulation check in spec 07.
- **Copy audit strictness:** a static hardcoded-string test can be noisy. Spec 07 allows narrowing it to copy-heavy folders with a documented limitation.
- **Deployment:** no provider is assumed. The README documents local usage; a deployment link is optional.
- **Challenge time reporting:** the brief does not ask for it, but the README may include a short note if the reviewer expects one.
- **Live API stability:** the contract was verified on 2026-11-10. If the API changes, re-run the curl checks in `docs/api/README.md` and regenerate types.
