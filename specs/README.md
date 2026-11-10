# Coding Agent Specs — cocos-challenge-frontend

This folder contains the implementation specs for the frontend challenge. Each spec is written to be executed by a coding agent with minimal ambiguity. Read this file first, then execute the specs in order.

## Execution order

| # | Spec | Depends on |
|---|---|---|
| 00 | [API contract](./00-api-contract.md) | — |
| 01 | [Foundation](./01-foundation.md) | 00 |
| 02 | [App shell, theme & i18n](./02-app-shell-theme-i18n.md) | 01 |
| 03 | [Instruments](./03-instruments.md) | 02 |
| 04 | [Search](./04-search.md) | 02 |
| 05 | [Portfolio](./05-portfolio.md) | 02 |
| 06 | [Orders](./06-orders.md) | 02, 05 |
| 07 | [Hardening & docs](./07-hardening-docs.md) | 03–06 |

**Sequential rule:** one agent runs the specs strictly in order, 00 → 07. Each spec gets its own branch (`spec/NN-<name>`) and PR; the user squash-merges it before the next spec branches from `main`. Spec 02 creates stubs for every page and for the order modal container so every intermediate state runs; feature specs replace their own stubs. Each feature owns its page and i18n namespace. The “Files owned” lists describe a spec’s scope for reviewers; touching another file is allowed when needed, with the reason stated in the PR.

## Source of truth

- Challenge brief: `../frontend-challenge.md`
- API contract: `../docs/api/openapi.yaml` (created in spec 00)
- Human-readable API notes: `../docs/api/README.md` (created in spec 00)
- Session decisions: `../sessions/00-design-decisions.md`, refined by `../sessions/01-plan-grilling.md` and `../sessions/02-theme-palette.md`

The live API is `https://dummy-api-topaz.vercel.app`. It requires headers that are not documented in the challenge brief. The client always sends:

```http
X-Enable-Bugs: off
X-Candidate-Id: <anonymous session key>
```

## Final stack

| Concern | Choice | Version |
|---|---|---|
| Runtime | Node.js | >= 22 |
| Package manager | npm | lockfile committed |
| UI | React + React DOM | 19.3.x |
| Build | Vite + `@vitejs/plugin-react` | 8.3.x / 6.3.x |
| Language | TypeScript | **5.9.3 (pinned)** |
| Routing | React Router DOM | 7.18.x |
| Server state | TanStack Query | 5.107.x |
| Client state | React context + `useReducer` | — |
| Styles | Sass + CSS Modules | 1.108.x |
| Modal primitive | `@radix-ui/react-dialog` | 1.3.x |
| Icons | `lucide-react` | 1.71.x |
| Font | `@fontsource-variable/plus-jakarta-sans` | 5.3.x |
| i18n | `i18next` + `react-i18next` | 27.1.x / 18.0.x |
| HTTP | native `fetch` behind `shared/api` | — |
| Tests | Vitest + RTL + user-event + MSW | 5.1.x / 16.3.x / 14.6.x / 3.0.x |
| Lint/format | ESLint 10 + typescript-eslint 8 + Prettier 3 | — |
| API types | `openapi-typescript` | 7.13.x |

**Why TypeScript 5.9.3 and not 7.x:** `typescript-eslint` supports `<6.1.0` and `openapi-typescript` declares `^5.x`. TS 7 breaks the current lint/codegen toolchain.

**No Redux.** TanStack Query satisfies the challenge’s state requirement. The order ticket uses a small context.

## Architecture

```text
src/
  app/                  # composition root
    App.tsx
    providers/          # AppProviders, ErrorBoundary
    router.tsx
    layout/             # AppLayout, Header, MobileNav, SkipLink
    theme/              # ThemeProvider, useTheme, boot helpers
    styles/             # tokens, mixins, reset, globals

  pages/                # thin route screens
    instruments/
    portfolio/
    search/
    not-found/

  features/
    instruments/        # API + query + list UI
    portfolio/          # API + query + summary/positions UI
    search/             # API + query + debounced search UI
    order/              # context, validation, form, modal, mutation

  entities/
    instrument/         # types, return %, ticker/type display
    position/           # holding types, market value, P&L, return %

  shared/
    api/                # env, candidate, HTTP client, errors, query client, keys
    i18n/               # i18next init, typed resources, useFormat
    lib/                # formatting, math, hooks, cx
    ui/                 # design-system primitives
    test/               # setup, MSW server, render helper, fixtures
```

### Layer dependency rule

```text
app → pages → features → entities → shared
```

- `app` only composes providers, routes, layout and styles.
- `pages` are thin: they fetch through feature hooks and compose feature UI.
- `features` own use cases and may import `entities` and `shared`.
- `entities` own domain types and pure calculations; they may import `shared`.
- `shared` has no domain rules and imports nothing from upper layers.
- Features **must not import each other**. Pages compose features. Cross-feature actions (e.g. opening the order modal) are exposed through the order feature’s public context hook and consumed by pages.

## State boundaries

| State | Owner |
|---|---|
| Instruments, portfolio, search, order submission | TanStack Query |
| Order ticket open/closed, selected instrument, preset side/quantity | `OrderTicketProvider` (React context + `useReducer`) |
| Search query | URL (`?q=`) |
| Form values and validation | Local component state |

## API rules

- All requests go through `shared/api/http.ts`. **No direct `fetch` anywhere else.**
- Every request sends `X-Enable-Bugs` and `X-Candidate-Id`.
- Candidate resolution: `VITE_CANDIDATE_ID` → `localStorage["ccs.candidateId"]` → generated `crypto.randomUUID()` persisted in `localStorage`. Never shown in the UI.
- Bug mode defaults to `off`. It is configurable only through `VITE_API_BUG_MODE` for manual QA.
- Query retries: allowed for `5xx`/network failures only, max 1 retry. **Order mutations never retry.**
- `ApiError` is the only error type thrown by the client. UI maps known server messages to i18n keys and falls back to the raw message.

## Domain rules

```text
Instrument return % = (last_price - close_price) / close_price * 100
Market value        = quantity * last_price
P&L ($)             = (last_price - avg_cost_price) * quantity
Position return %   = (last_price - avg_cost_price) / avg_cost_price * 100
Shares from amount  = floor(amount / last_price)
```

- Guard every division against `0`, `null`, `undefined`, `NaN` and `Infinity`.
- Render `—` instead of invalid numbers.
- Share quantities are always positive integers. Never submit fractions.

## i18n rules

- Languages: `es` (default/fallback) and `en`.
- First visit: stored `ccs.lang` → first browser language starting with `es` or `en` → `es`.
- Only an explicit language switch is persisted.
- All UI copy goes through `t()`. No hardcoded strings in components, including `aria-label`, `title`, empty states and errors.
- Translation resources are type-safe. `es` files use `satisfies typeof en`.
- Feature specs own their namespace files: `instruments`, `portfolio`, `search`, `orders`, `validation`.
- Formatting follows the selected language:
  - EN: `ARS 1,234.56`, `+12.34%`, `1,234`
  - ES: `$ 1.234,56`, `+12,34%`, `1.234`
- Order status badges show the translated label **and** the raw API code.

## Theme rules

- Dark and light themes using CSS custom properties.
- Initial theme: stored `ccs.theme` → `prefers-color-scheme` → `light`.
- Palette: cocos.capital light tokens, dark derived from their navy; font Plus Jakarta Sans. See spec 01 and `../sessions/02-theme-palette.md`.
- Only an explicit toggle is persisted.
- The inline boot script in `index.html` sets `data-theme` and `lang` before React renders.
- Both themes must pass contrast checks and render form controls correctly.

## UI expectations

Every data screen implements:

- loading skeleton
- error state with retry
- empty state
- responsive layout at 375 / 768 / 1280 px
- semantic table on desktop, card list on mobile
- keyboard-operable actions
- `aria-live` for order results

## Definition of done

Run and pass:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run api:types:check
```

Plus:

- No direct `fetch` outside `shared/api/http.ts`.
- No feature-to-feature imports.
- No hardcoded UI strings.
- EN/ES resource parity test passes.
- Order flow works with keyboard only.
- Both themes work.
- No fractional shares can be submitted.
- Order mutations do not retry.
- README documents setup, scripts, env vars, API headers and candidate behavior.

## Spec format

Every spec uses this structure:

1. Goal
2. Depends on
3. Files owned
4. Contracts
5. Numbered requirements
6. UI states and copy
7. Tests required
8. Acceptance criteria
9. Out of scope
10. Agent notes

## Notes convention

Design decisions are recorded in `../sessions/`:

```text
sessions/NN-<topic>.md
```

- One file per AI agent session, numbered from `00`.
- Never rewrite a previous session note; add a new numbered file.
- Each note starts with frontmatter: session, date, agent, mode, title, status, related specs.
- Notes capture decisions, rationale, rejected alternatives and API discoveries — not a transcript.

The first note is `sessions/00-design-decisions.md`.
