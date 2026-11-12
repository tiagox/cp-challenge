# AGENTS.md

This file is the fast on-ramp for coding agents working in this repository. Read it before touching code, then follow the specs it points to. If this file and a spec disagree, the spec wins.

## Current state

The repository currently contains **definitions only**:

- `frontend-challenge.md` — original challenge brief
- `specs/` — implementation specs for coding agents
- `sessions/` — AI-session decision records

There is no application code yet. Do not assume `src/`, `package.json`, `docs/api/` or test infrastructure exist. They are created by the specs, starting with spec 00.

## Read first

1. `frontend-challenge.md` — what the product must do
2. `specs/README.md` — stack, architecture, global rules, definition of done
3. `sessions/00-design-decisions.md` — why the specs look the way they do
4. `sessions/01-plan-grilling.md` — decisions that refine session 00
5. `sessions/02-theme-palette.md` — palette, font and theme fallback
6. `sessions/03-agent-setup-and-handoff.md` — agent setup and hand-off notes for spec 00
7. `sessions/05-search-in-instruments.md` — search is a box on the instruments page, not a screen
8. `sessions/06-app-name.md` — the app is called CP Invest; the UI never mentions Cocos
9. `sessions/07-spec-02-handoff.md` — spec 01 implementation facts and hand-off to spec 02
10. `sessions/08-spec-03-handoff.md` — spec 02 implementation facts, ponytail review workflow, hand-off to spec 03
11. `sessions/09-spec-04-handoff.md` — spec 03 implementation facts and hand-off to spec 04
12. `sessions/10-spec-05-handoff.md` — spec 04 implementation facts, test patterns, hand-off to spec 05
13. `sessions/11-spec-06-handoff.md` — spec 05 implementation facts and hand-off to spec 06
14. The spec you are assigned
15. The specs it depends on, especially their “Contracts” and “Files owned” sections

Do not read only the task description. File ownership and layering rules are enforced by the specs.

## Execution plan

| Order | Spec | Depends on | Notes |
|---|---|---|---|
| 1 | `specs/00-api-contract.md` | — | OpenAPI, generated types, HTTP client, minimal scaffold |
| 2 | `specs/01-foundation.md` | 00 | Tooling, Sass, i18n infra, entities, test infra |
| 3 | `specs/02-app-shell-theme-i18n.md` | 01 | Providers, router, layout, theme, UI kit, stubs |
| 4 | `specs/03-instruments.md` | 02 | Instruments list and BUY entry point |
| 5 | `specs/04-search.md` | 03 | Ticker search box on the instruments page (`?q=`) |
| 6 | `specs/05-portfolio.md` | 02 | Exposes `usePortfolio` |
| 7 | `specs/06-orders.md` | 02, 05 | Needs `usePortfolio` from spec 05 |
| 8 | `specs/07-hardening-docs.md` | 03–06 | Run last |

Rules:

- Do not skip specs 00–02. Every later spec assumes their files, aliases and test setup.
- A single agent runs the specs strictly in order. The stages exist to make the work easy to follow, not to parallelize it.
- One branch and one PR per spec: `spec/NN-<name>`, branched from the updated `main`. Open the PR with `gh`, summarize what changed against the spec, then stop. The user reviews and squash-merges before the next spec starts.
- Stay within the files your spec lists. If another file must change, say why in the PR and keep the edit minimal.
- Do not start spec 06 before spec 05 exposes its public `usePortfolio` hook.
- Do not build product features during spec 07. It is hardening, QA and documentation only.

## Non-negotiable stack

| Concern | Choice |
|---|---|
| Runtime | Node.js >= 22 |
| Package manager | npm (commit the lockfile) |
| Language | TypeScript **5.9.3 pinned** |
| UI | React 19.3.x |
| Build | Vite 8.3.x |
| Routing | React Router DOM 7.18.x |
| Server state | TanStack Query 5.107.x |
| Client state | React context + `useReducer` |
| Styles | Sass 1.108.x + CSS Modules |
| Modal | `@radix-ui/react-dialog` |
| Icons | `lucide-react` |
| Font | `@fontsource-variable/plus-jakarta-sans` (self-hosted) |
| i18n | `i18next` + `react-i18next` |
| HTTP | native `fetch` behind `shared/api/http.ts` |
| Tests | Vitest + RTL + user-event + MSW |
| API types | `openapi-typescript` |

Do not introduce Redux, Axios, Orval, Tailwind, styled-components, another icon library or TypeScript 7. TypeScript 7 breaks the current `typescript-eslint` and `openapi-typescript` peer ranges.

## Architecture

```text
app → pages → features → entities → shared
```

- `app` — providers, router, layout, theme, global composition
- `pages` — thin route screens; compose features
- `features` — use cases, API calls, feature UI
- `entities` — domain types and pure calculations
- `shared` — generic infrastructure with no domain rules

Hard rules:

- **Features must not import other features.** Pages and app-level containers compose them.
- `shared` imports nothing from upper layers.
- Cross-feature composition belongs in `pages` or `app`. The order modal’s portfolio lookup lives in `src/app/layout/OrderModalContainer.tsx`, not inside `features/order`.
- Domain formulas live in `entities/**` only. Never duplicate them in components.
- All requests go through `shared/api/http.ts`. No direct `fetch` anywhere else.

## State ownership

| State | Owner |
|---|---|
| Instruments, portfolio, search, order submission | TanStack Query |
| Order ticket open state, instrument, presets | `OrderTicketProvider` |
| Search query | URL (`/instruments?q=`) |
| Form values and validation | Local component state |
| Theme | `ThemeProvider` + `localStorage` + boot script |
| Language | i18next + `localStorage` + boot script |

Do not copy server data into React state or a global store. Do not add Redux.

## API rules and traps

Base URL: `https://dummy-api-topaz.vercel.app`

Every request must send:

```http
X-Enable-Bugs: off
X-Candidate-Id: <candidate key>
```

- Missing `X-Enable-Bugs` returns `400`, even though the challenge brief does not mention the header.
- Missing `X-Candidate-Id` returns `400` on `/portfolio` and `/orders`.
- Never expose `easy`, `medium` or `hard` bug modes in the product. `off` is the only supported mode.
- Candidate resolution: `VITE_CANDIDATE_ID` → `localStorage["cp.candidateId"]` → generated UUID persisted in storage. Never show it in the UI.
- `/portfolio` returns `{ cash, holdings }`. A new candidate starts at `{ "cash": 1000000, "holdings": [] }`.
- `/search` matches ticker case-insensitively by substring. Empty query returns all; the app must not call it for empty input.
- `POST /orders` returns `201` with the full order. Validation failures are `400 { "error": "..." }`, not a `201` with `REJECTED`.
- LIMIT BUY validates cash against the limit price. MARKET uses `last_price`.
- Order mutations **never retry**. Query retries are allowed once for network/5xx only.
- Invalidate the portfolio query after a successful order. Do not optimistically mutate the portfolio.
- Generated types live in `src/shared/api/generated/schema.ts` and must not be edited by hand.

## Domain formulas

```text
Instrument return % = (last_price - close_price) / close_price * 100
Market value        = quantity * last_price
P&L ($)             = (last_price - avg_cost_price) * quantity
Position return %   = (last_price - avg_cost_price) / avg_cost_price * 100
Shares from amount  = floor(amount / last_price)
```

Guard every division against `0`, `null`, `undefined`, `NaN` and `Infinity`. Render `—` instead of invalid numbers. Shares are always positive integers; never submit fractions.

## i18n rules

- Languages: `es` (default/fallback) and `en`.
- Detection: stored `cp.lang` → first browser language starting with `es` or `en` → `es`.
- Only an explicit switch is persisted.
- All UI copy goes through `t()`, including `aria-label`, titles, empty states, hints and errors. No hardcoded user-facing strings.
- Translation resources are type-safe; `es` files use `satisfies typeof en`.
- One namespace per feature: `instruments`, `portfolio`, `search`, `orders`, `validation`. Feature specs own their namespace files.
- Formatting follows the UI language, not the browser locale:
  - EN: `ARS 1,234.56`, `+12.34%`, `1,234`
  - ES: `$ 1.234,56`, `+12,34%`, `1.234`
- Map known API error messages to translation keys. Order status badges show the translated label **and** the raw API code.

## Theme rules

- Dark and light themes via CSS custom properties.
- Initial theme: stored `cp.theme` → `prefers-color-scheme` → `light`.
- Palette and font follow cocos.capital (light) with a dark theme derived from its navy; exact tokens live in spec 01. Borrow the palette and font only: no Cocos logo, name or imagery.
- Use `--color-accent` only as a fill; accent-coloured text, links and focus rings use `--color-accent-text`.
- Only an explicit toggle is persisted.
- The inline boot script in `index.html` sets `data-theme` and `lang` before React renders.
- Boot script and React providers must resolve theme/language with identical rules.
- Both themes must pass contrast and focus checks.

## Order form rules

- Quantity and amount are linked through `last_price`:
  - quantity changes → `amount = round2(quantity * last_price)`
  - amount changes → `quantity = floor(amount / last_price)`
- The last edited field wins; the derived field never overwrites it.
- Limit price is independent and only shown for LIMIT orders.
- Estimated total uses the effective price: limit price for LIMIT, last price for MARKET.
- LIMIT BUY validates cash at the limit price; MARKET BUY validates at the last price.
- SELL validates against the available holding quantity.
- `last_price <= 0` shows an unavailable message and disables submit.
- The payload includes `price` only for LIMIT orders.
- The modal stays open after submission so the user can read the returned `id` and `status`.
- The result region uses `aria-live`; invalid submit focuses the first invalid field.

## Testing expectations

Every behavior spec includes its own required tests. In addition:

- Use MSW as the network boundary. Handlers must reject missing/wrong API headers.
- Use `renderWithProviders` from `src/test/render.tsx`. Extend it only in the spec that owns it.
- Tests render in `en` by default even though the app defaults to `es`; pass `{ lang: 'es' }` to test Spanish. Every feature has at least one `es` test.
- Unit-test pure calculations, validation and error mapping.
- Feature-test loading, error, empty, localized copy and the main interaction.
- Test integer-share enforcement and both quantity → amount directions.
- Test that order mutations do not retry and that the portfolio is invalidated after success.
- Do not weaken tests to make them pass. Fix the behavior or document a narrowed assertion.

## Commands

After spec 00/01 create the project:

```bash
npm run dev
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run test:coverage
npm run build
npm run api:types
npm run api:types:check
```

All must pass before hand-off. `npm run api:types:check` must be run after changing `docs/api/openapi.yaml`.

## Definition of done

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run api:types:check`

Plus:

- No direct `fetch` outside `src/shared/api/http.ts`.
- No feature-to-feature imports.
- No hardcoded user-facing strings.
- EN/ES resource parity test passes.
- Both themes work.
- Order flow works with keyboard only.
- No fractional shares can be submitted.
- No horizontal overflow at 375 px.
- README documents setup, scripts, env vars, API headers and candidate behavior.

## File ownership and hand-off

- Each spec lists its owned files. Treat that list as a guide to the spec's scope.
- Spec 02 creates page stubs and the `OrderModalContainer` stub. Feature specs replace only their own stubs.
- Spec 06 replaces the `OrderModalContainer` body but keeps its path and export name.
- Do not rewrite earlier specs. If an implementation forces a decision change, add a new numbered note:
  - `sessions/NN-<topic>.md` (next free number)
  - frontmatter: session, date, agent, mode, title, status, related specs
  - capture the decision, rationale and rejected alternatives
- Never edit `sessions/00-design-decisions.md` after it is committed.
- Keep `README.md` current as features land; spec 07 owns the final version.

## Scope discipline

- Do not add features not in the challenge: no auth, order history, charts, sorting, pagination, cancellation or partial fills.
- Do not add dependencies because they are convenient. The stack is intentional and version-pinned.
- Do not redesign screens while implementing a spec. If a spec is ambiguous, choose the simplest option consistent with the rules and note it.
- Prefer semantic HTML and native controls over ARIA-heavy custom widgets.
- Keep pages thin. Most logic belongs in features, entities or shared hooks.

## When in doubt

1. Re-read the owning spec’s requirements, acceptance criteria and out-of-scope list.
2. Follow the layer rule.
3. Follow the API client rules.
4. Keep the change smaller.
5. Document the deviation in the hand-off message and, if it changes a decision, in a new note.

## Agent skills

### Issue tracker

No issue tracker; specs in `specs/` define the work. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### React best practices

Load the `react-best-practices` skill (`.claude/skills/react-best-practices/`) before writing, reviewing or refactoring React code, from spec 02 onwards. Apply its client-side rules (`rerender-*`, `rendering-*`, `js-*`, `advanced-*`, and `async-*`/`bundle-*` where they fit a client app).

The skill targets Next.js; this repo is a Vite SPA. The specs and this file win on any conflict:

- `server-*`, `async-api-routes` and `rendering-hydration-no-flicker` do not apply: there is no server rendering. The `index.html` boot script already prevents theme/language flicker.
- `client-swr-dedup`: use TanStack Query, never SWR.
- `async-dependencies`: do not add `better-all`; use `Promise.all` or TanStack Query dependent queries.
- `bundle-dynamic-imports`: use `React.lazy` + `Suspense` (as in spec 02), not `next/dynamic`.
- `bundle-barrel-imports`: the specs' public `index.ts` per feature/UI component is the layer boundary and stays. Apply the rule to third-party libraries (e.g. import lucide icons by name, never the whole set).
- Do not add memoization by reflex. Use `memo`/`useMemo`/`useCallback` only where a rule's problem actually occurs.
