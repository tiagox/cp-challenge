# Spec 07 — Hardening, QA & Documentation

| | |
|---|---|
| **Status** | Ready |
| **Depends on** | [03 — Instruments](./03-instruments.md), [04 — Search](./04-search.md), [05 — Portfolio](./05-portfolio.md), [06 — Orders](./06-orders.md) |
| **Owns** | Final README, QA checklist, cross-feature integration tests, cleanup and final verification |
| **Must not do** | Add features, change the API contract, redesign screens, or change feature behavior |

## 1. Goal

Close the project with a hardening pass and production-quality documentation.

This spec is deliberately small in code and strict in verification. It must not add new product scope. It exists to:

- replace every temporary stub left by earlier specs
- prove the critical flows work end-to-end across features
- audit EN/ES, dark/light, responsive layout and accessibility
- remove dead code, duplicate copy and unused dependencies
- write the final `README.md`
- run the full definition-of-done command set
- record a manual QA checklist that a reviewer can follow

## 2. Files owned

Create or modify only:

```text
README.md
docs/qa/manual-checklist.md

src/test/critical-flows.test.tsx
src/test/persistence.test.tsx
src/test/error-boundary.test.tsx
src/test/copy-audit.test.ts
```

You may make minimal supporting edits in earlier specs’ files **only** when they fix a failing test, a stub left behind, a broken translation key, an accessibility defect or an accidental API-client violation. Record every such edit in the final hand-off message.

## 3. Stub and placeholder audit

Verify and fix:

- [ ] `src/pages/instruments/InstrumentsPage.tsx` renders the real instruments feature (not `common.comingSoon`).
- [ ] `src/pages/search/SearchPage.tsx` renders the real search feature.
- [ ] `src/pages/portfolio/PortfolioPage.tsx` renders the real portfolio feature.
- [ ] `src/app/layout/OrderModalContainer.tsx` renders the real order modal and no longer returns `null`.
- [ ] `src/App.tsx` renders only `AppProviders`.
- [ ] No remaining page stub, `TODO`, `FIXME`, `console.log`, `debugger`, commented-out block or `placeholder` component in `src/`.
- [ ] `common.comingSoon` is unused; keep or remove it consistently in EN and ES.
- [ ] No feature imports another feature. The only cross-feature composition is `src/app/layout/OrderModalContainer.tsx` importing `usePortfolio`.
- [ ] No direct `fetch(` outside `src/shared/api/http.ts`.
- [ ] No duplicate metric formula outside `src/entities/**`.
- [ ] Generated API types are untouched and still match `docs/api/openapi.yaml`.

## 4. Cross-feature integration tests

### `src/test/critical-flows.test.tsx`

Render the real router/app providers or the closest composition available. Use MSW handlers and fixture data.

If `src/app/router.tsx` only exports the browser router, extract and export the route configuration (for example `appRoutes`) and build a `createMemoryRouter(appRoutes, { initialEntries: [...] })` in the test. Do not mount `createBrowserRouter` directly in jsdom. This is an allowed supporting edit; document it in the hand-off.

Required flows:

1. **Instruments → order → portfolio**
   - visit `/instruments`
   - click “Trade” on `DYCA`
   - modal opens in BUY/MARKET mode with `DYCA` in the title
   - submit a valid quantity
   - POST body is `{ instrument_id, side: 'BUY', type: 'MARKET', quantity }` with no `price`
   - success view shows the returned order `id` and `FILLED`
   - `queryKeys.portfolio` is invalidated
2. **Portfolio → sell preset**
   - visit `/portfolio`
   - click “Sell” on a holding
   - modal opens in SELL mode with quantity equal to the holding quantity
   - submit sends `side: 'SELL'` and the same integer quantity
3. **Search → order**
   - visit `/search`
   - type a ticker
   - result click opens the modal in BUY mode
   - URL contains the query
4. **Order error path**
   - server returns `400 { error: 'Insufficient cash' }`
   - UI shows the localized rejection message and no order id
   - the form remains usable
5. **Limit order**
   - switch to LIMIT
   - price field appears
   - submitted body includes `price`
   - status `PENDING` renders the pending copy
6. **Navigation**
   - desktop or mobile nav moves between the three sections
   - active route is marked
   - unknown route renders the not-found page and the link back works

Assert loading, empty and error states at least once each across the suite; feature specs already cover them in isolation.

### `src/test/persistence.test.tsx`

- `ccs.lang` persists after an explicit switch and survives a remount.
- `ccs.theme` persists after an explicit toggle and survives a remount.
- a stored language wins over the browser language on boot.
- a stored theme wins over `prefers-color-scheme` on boot.
- `ccs.candidateId` is created once, reused, and never rendered in the UI.
- `VITE_CANDIDATE_ID` takes precedence over `localStorage` when provided to the config helper.
- the boot script and React providers resolve the same theme/language for the same inputs.

### `src/test/error-boundary.test.tsx`

- a component that throws is caught by `ErrorBoundary`
- the fallback shows the translated unexpected-error title and retry action
- retry resets the boundary and renders the child again
- the error is not shown as an empty screen

### `src/test/copy-audit.test.ts`

Static test using `fs` + `path` (Node environment is available in Vitest) over `src/**/*.tsx`:

- fail on common user-facing literals in JSX attributes or text that are not wrapped by `t(`, `Trans`, or a non-copy constant
- allowlist: `EN`, `ES`, `ARS`, ticker symbols, CSS class names, `aria-*` technical values, test ids and lucide icon names
- assert every `t('...')` key exists in both `en` and `es`
- assert no translation value is an empty string

If a full static scan is too noisy to maintain, narrow it to the known copy-heavy folders (`src/app/layout`, `src/pages`, `src/features`) and document the limitation. Do not ship a permanently failing test.

## 5. EN/ES audit

Manual + test checklist:

- [ ] Every screen has EN and ES copy; no mixed-language screen.
- [ ] `locales.parity.test.ts` passes with identical key sets.
- [ ] `es` resources satisfy the `typeof en` type.
- [ ] Plural keys use i18next `_one` / `_other` forms correctly in both languages.
- [ ] Interpolations (`{{ticker}}`, `{{count}}`, `{{id}}`, `{{query}}`) are identical in EN and ES.
- [ ] Validation messages are translated, including server-mapped errors.
- [ ] Order status shows a translated label plus the raw API code (`FILLED`, `PENDING`, `REJECTED`).
- [ ] Currency uses `ARS` in both languages.
- [ ] EN numbers: `1,234.56`; ES numbers: `1.234,56`.
- [ ] Percent signs and signs (`+`/`-`) render correctly in both languages.
- [ ] No raw English fallback flashes during language switching.
- [ ] `document.documentElement.lang` matches the active language.
- [ ] Language labels stay `EN` / `ES` and are not translated.

## 6. Theme audit

Check both themes at 375, 768 and 1280 px:

- [ ] Page, header, mobile nav, modal, cards, table rows and inputs use theme tokens.
- [ ] Text, muted text, borders, accent, positive, negative and warning meet readable contrast.
- [ ] Focus rings are visible on both backgrounds.
- [ ] Disabled and pending states are distinguishable.
- [ ] Skeleton shimmer is visible but not distracting.
- [ ] The modal overlay, backdrop and close button are readable.
- [ ] Native form controls follow `color-scheme`.
- [ ] No flash of the wrong theme on reload (boot script works).
- [ ] `prefers-color-scheme` is respected until an explicit choice is made.
- [ ] `prefers-reduced-motion: reduce` removes non-essential animation.

## 7. Responsive and accessibility audit

### Responsive

- [ ] No horizontal page scroll at 375 px on any route or modal.
- [ ] Tables switch to cards below `768px`; no clipped columns.
- [ ] Mobile bottom nav never covers the last row, form action or CTA (safe-area padding).
- [ ] Modal is a bottom sheet on mobile and stays scrollable with the keyboard open.
- [ ] Touch targets are at least 44 px tall.
- [ ] Long ticker/name text truncates or wraps without breaking layout.
- [ ] Loading skeletons match the final layout closely enough to avoid jumps.

### Accessibility

- [ ] Keyboard-only run: skip link → header → nav → screen → modal → submit → close.
- [ ] Skip link appears on focus and moves focus to `#main`.
- [ ] Focus is trapped in the modal and restored to the trigger on close.
- [ ] ESC closes the modal.
- [ ] Every icon-only button has an accessible name.
- [ ] Every form control has a label; errors are linked with `aria-describedby`.
- [ ] Invalid submit focuses the first invalid field.
- [ ] Order result is announced through `aria-live`.
- [ ] Tables have captions and proper header scopes.
- [ ] Active nav item exposes `aria-current="page"`.
- [ ] Color is not the only signal for positive/negative values (signs and labels are present).

## 8. API and resilience audit

- [ ] Every request sends `X-Enable-Bugs: off`.
- [ ] Every request sends a non-empty `X-Candidate-Id`.
- [ ] Missing candidate header is impossible through the app client.
- [ ] Candidate ID is never shown in the UI or in the DOM as visible text.
- [ ] Requests time out after 15 s and surface a localized timeout error.
- [ ] Network failures surface a localized retry state.
- [ ] Queries retry at most once and only for network/5xx.
- [ ] Order mutations never retry.
- [ ] Double submit is impossible.
- [ ] Portfolio is invalidated after a successful order.
- [ ] LIMIT BUY cash validation uses the limit price.
- [ ] SELL cannot exceed the holding quantity.
- [ ] Fractional shares cannot be submitted through any path (typed, pasted, amount conversion).
- [ ] `last_price: 0` disables submission with a clear message.
- [ ] Abort signals are passed from TanStack Query and do not surface as user errors.
- [ ] No unhandled promise rejections in the console during the manual run.

## 9. Final README

Replace the skeleton `README.md` with a complete document. Required sections:

1. **Title and one-paragraph overview** — what the app does, which challenge it solves.
2. **Live demo / local preview** — how to run it; a deployment link only if one exists.
3. **Tech stack** — React, TypeScript, Vite, TanStack Query, Sass, React Router, i18next, Radix, Vitest/MSW.
4. **Getting started**
   ```bash
   nvm use 22        # or any Node >= 22
   npm ci
   cp .env.example .env
   npm run dev
   ```
5. **Environment variables** — `VITE_API_BASE_URL`, `VITE_CANDIDATE_ID`, `VITE_API_BUG_MODE`; state that the candidate ID is optional and an anonymous UUID is generated and persisted.
6. **Scripts table** — `dev`, `build`, `preview`, `lint`, `format`, `typecheck`, `test`, `test:coverage`, `api:types`, `api:types:check`.
7. **API notes** — base URL, required headers (`X-Enable-Bugs`, `X-Candidate-Id`), candidate semantics, bug-mode warning, links to `docs/api/openapi.yaml` and `docs/api/README.md`.
8. **Architecture** — the `app → pages → features → entities → shared` rule, feature list, state ownership table (TanStack Query vs context vs URL vs local state), and a short directory tree.
9. **Product behavior** — instruments return, portfolio metrics, search, order ticket quantity/amount linking, LIMIT vs MARKET, validation rules.
10. **i18n** — EN default, ES support, detection order, persistence, formatting behavior.
11. **Theming** — dark/light, detection order, persistence, no-flash boot script.
12. **Testing** — what is covered, how to run, MSW usage, the critical-flow suite, coverage command.
13. **Accessibility and responsiveness** — key guarantees and manual checklist link.
14. **Design decisions** — link to `notes/00-design-decisions.md` and `specs/README.md`.
15. **Known limitations** — no order history, no auth, candidate identity is anonymous, server bug modes are not used, LIMIT orders are not simulated/cancelled.
16. **Time spent** — optional short note, only if the challenge reviewer expects it.

Keep it skimmable: short paragraphs, tables and code blocks. Do not paste the whole spec set.

## 10. Manual QA checklist

Create `docs/qa/manual-checklist.md` with a reproducible script:

- setup and seed steps (fresh candidate vs existing candidate)
- desktop pass at 1280 px
- tablet pass at 768 px
- mobile pass at 375 px
- dark and light theme passes
- EN and ES passes
- keyboard-only pass
- order scenarios:
  - MARKET BUY with cash
  - MARKET BUY over cash → rejected
  - MARKET SELL whole position
  - MARKET SELL over holding → rejected
  - LIMIT BUY at a price within cash → PENDING
  - LIMIT BUY above cash → rejected
  - LIMIT SELL → PENDING
  - fractional quantity attempt
  - amount-based quantity flooring
  - last price `0` case
- refresh/back-forward/deep-link checks
- failure injection: network offline, timeout, 500
- each item has a checkbox and a short expected result

## 11. Cleanup

- Remove unused dependencies introduced during exploration; run `npm ls --depth=0`.
- Remove unused exports flagged by `noUnusedLocals`/review.
- Ensure every `index.ts` public API is intentional.
- Confirm no generated file is edited by hand.
- Confirm `.gitignore` covers `node_modules`, `dist`, `coverage`, `.env`, `.DS_Store`.
- Confirm `.env.example` is committed and `.env` is not.
- Confirm `package-lock.json` is committed.
- Confirm `npm ci` works from a clean checkout.
- Confirm no secrets or personal candidate IDs are committed.

## 12. Final verification

Run from a clean install:

```bash
rm -rf node_modules dist coverage
npm ci
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run test:coverage
npm run build
npm run api:types:check
npm run preview
```

Then open the preview and complete `docs/qa/manual-checklist.md`.

Expected:

- all commands exit `0`
- coverage reports the tested modules with no untested critical validation branch
- the production build loads with no console errors
- a fresh browser profile starts in EN or ES per browser language, dark or light per system preference, with a new candidate and `{ cash: 1000000, holdings: [] }`
- reload preserves explicit language, theme and candidate

## 13. Acceptance criteria

- Every stub is replaced; no placeholder copy remains.
- `src/test/critical-flows.test.tsx` covers the instruments → order and portfolio → sell paths.
- Persistence, error boundary and copy-audit tests pass.
- EN/ES parity and interpolation checks pass.
- Both themes pass the manual contrast/focus audit.
- No horizontal overflow at 375, 768 or 1280 px.
- Keyboard-only order flow works.
- No direct `fetch` outside the HTTP client.
- No feature-to-feature imports.
- No hardcoded user-facing copy.
- `README.md` is complete and accurate.
- `docs/qa/manual-checklist.md` exists and matches the shipped app.
- The final command set in section 12 passes from a clean install.
- No known critical or high-severity defect is left undocumented.

## 14. Out of scope

- New product features or screens
- Authentication or real user accounts
- Order history, cancellation or modification
- Charts, sorting, filtering or pagination
- Server-side changes
- CI/CD provisioning (document the commands, do not assume a CI provider)
- Rewriting earlier specs
- Large refactors that are not required to pass QA

## 15. Agent notes

- Prefer fixing the smallest possible surface when a QA item fails; do not redesign a feature in this spec.
- If a manual-only check cannot be automated reliably (contrast, bottom-sheet keyboard behavior), keep it in `docs/qa/manual-checklist.md` and state that it was verified manually.
- Do not weaken tests to make them pass. Fix the behavior or narrow the assertion for a documented reason.
- Keep `notes/` append-only. If this session changes an earlier decision, add `notes/01-hardening.md` instead of editing `notes/00-design-decisions.md`.
- The final hand-off message must list: commands run, results, manual checks completed, remaining limitations and any files edited outside this spec’s ownership.
