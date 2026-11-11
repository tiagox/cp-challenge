---
session: 08
date: 2026-11-11
agent: claude-code
mode: build
title: Spec 02 implementation notes and hand-off to spec 03
status: accepted
related_specs:
  - specs/02-app-shell-theme-i18n.md
  - specs/03-instruments.md
---

# Session 08 — Spec 02 notes and hand-off to spec 03

## 1. Context

Spec 02 merged as PR #3 (`bee51ea`, squash of three commits). The PR description lists every deviation from the spec; this note keeps the ones later specs depend on, plus the review workflow the user started using.

### Review with ponytail

During this session the user installed the **ponytail** Claude Code plugin (marketplace `DietrichGebert/ponytail`, v5.3.3) and ran `/ponytail:ponytail-review` on the spec 02 commit. It reports findings as *Must fix / Should fix / Nice to have*, each with a concrete failure case, and changes no code. The user then picked which findings to fix. Expect the user to review later PRs the same way. The plugin also offers `ponytail-audit` (whole repo) and `ponytail-debt` (lists `shortcut:` comments).

The review on spec 02 found:

1. **Must fix:** React Router catches render errors inside routes and shows its own English "Unexpected Application Error!" page, so the outer `ErrorBoundary` never ran for page crashes. Fixed with an `errorElement` on `/`.
2. **Should fix:** per-component reduced-motion CSS was dead, because `globals.scss` already overrides every animation with `!important`. Removed.
3. **Nice to have:** the spec's boot script ignored `navigator.language` when `navigator.languages` was an empty list, unlike `resolveInitialLanguage`. Fixed.

## 2. Decisions taken during spec 02

- **Boot script differs from the spec §4.3 text.** It uses `const`/`let`/`for…of`. Every browser that can run the module bundle supports them, so ES5 syntax bought nothing. It also includes the empty-`navigator.languages` fallback above. `src/test/theme.test.tsx` runs the real script from `index.html` (`?raw`) and compares it with `resolveInitialTheme` / `resolveInitialLanguage`; keep that test when touching either side.
- **`ThemeProvider` derives the theme** as `explicitChoice ?? (prefersDark ? 'dark' : 'light')`, using the same rule as the boot script, instead of reading `data-theme` on mount. No effect syncs state from the media query.
- **Route errors:** `src/app/routes.tsx` sets `errorElement: <ErrorFallback onRetry={() => window.location.reload()} />` on `/`. `ErrorBoundary` still wraps the providers. A crash replaces the whole shell, header included.
- **`routes.tsx` vs `router.tsx`:** the route list lives in `routes.tsx`; `router.tsx` only calls `createBrowserRouter(routes)`. Tests build a memory router from `routes` without importing the browser-router singleton.
- **`VisuallyHidden`** uses a CSS Module with the `visually-hidden` mixin. Rejected: inline styles, which duplicated the mixin and overwrote the caller's `style`.
- **Language control** is the spec's `SegmentedControl` (EN/ES radios in a `fieldset`), not the `<select>` drawn on the session 05 canvas.
- **Files outside the owned list:** layout `*.module.scss` files, `src/app/layout/navItems.ts`, `ErrorBoundary.module.scss`, `NotFoundPage.module.scss`, `VisuallyHidden.module.scss`.

## 3. Facts spec 03 depends on

### Shared UI (`@/shared/ui/<Name>`)

- `PageHeader` takes `title`, `description`, `actions`. **There is no `count` prop**, and spec 03 must not change shared UI. Render `instruments.count` inside the page, e.g. in `description` or `actions`, and say which in the PR.
- `PercentText` defaults to `signed` and `tone="auto"`: positive is green with `+`, negative red, zero neutral, invalid `—`. `MoneyText` renders `—` for invalid values.
- `ErrorState` takes `title`, `description`, `onRetry`, `retryLabel`. It renders `role="alert"` and defaults to the `common` error copy.
- `EmptyState` renders its title as an `h2`; `PageHeader` owns the page `h1`.
- `Badge` variants: `neutral | positive | negative | warning | info`.
- `Button` defaults to `type="button"`. Variants: `primary | secondary | ghost | danger`; sizes `sm` (36px) and `md` (44px). Use `md` or `fullWidth` for the 44px touch targets on mobile.
- `Skeleton` (`text | rect | circle`) is `aria-hidden`. Pair it with `VisuallyHidden` or a `Spinner` for the `common.loading` status.
- Mixins: `@use '@/app/styles/mixins' as *;` gives `respond-to(md)` (min-width 768px), `focus-ring`, `visually-hidden`, `truncate`, `card-surface`.

### Data and domain

- `returnPercent(lastPrice, closePrice)` is in `@/entities/instrument/model/metrics`. There is no `entities/instrument/index.ts`; import from the model path. It returns `null` when `close_price <= 0` or a price isn't finite.
- `Instrument` type: `@/entities/instrument/model/types` (re-exports the API type).
- `queryKeys.instruments` is `['instruments']`. `http.get<T>(path, { signal })` is in `@/shared/api/http`. `ApiError.code` is one of `NETWORK | TIMEOUT | ABORTED | HTTP | INVALID_RESPONSE`.
- Fixture returns cover every case except invalid: `DYCA` positive, `CAPX` negative, `ARS` (`MONEDA`, 1/1) zero, `MIRG` `last_price: 0`, which gives **−100 %, not `—`**. For the invalid-return test, override the handler with an instrument whose `close_price` is `0`.

### Order ticket

- `useOrderTicket()` from `@/features/order` returns `{ state, open, close }`. `open({ instrument, side, quantity? })` takes `instrument: { id, ticker, name?, last_price }`.
- `OrderModalContainer` renders `null` until spec 06, so opening the ticket shows nothing yet. Assert through a consumer component, as spec 03 §8 says.

### Tests

- `renderWithProviders(ui, { route, lang, queryClient })` now wraps `QueryClientProvider` → `ThemeProvider` → `OrderTicketProvider` → `I18nextProvider` → `MemoryRouter`. A state-printing consumer rendered next to the page in `ui` shares the page's `OrderTicketProvider`.
- `renderApp({ route, lang })` renders the real route tree (layout, lazy pages, error element) through `createMemoryRouter`. Lazy pages need `findBy*`.
- **Desktop vs mobile in jsdom:** CSS is not applied, so if the table and cards are both rendered and toggled by CSS, both show up in tests and text queries find duplicates (spec 02's two navs needed `getAllByRole`). If you switch with `useMediaQuery('(min-width: 768px)')` instead, it returns `false` (mobile) in jsdom unless the test stubs `matchMedia`; see `stubPrefersDark` in `src/test/theme.test.tsx`. Pick one approach and state it in the PR.
- jsdom has no `matchMedia`. Stub it with `vi.stubGlobal` when behavior depends on it.

### Lint traps

- `jsx-a11y` is on. A click handler on `<tr>` or `<article>` (spec 03 "row/card is clickable for pointer convenience") triggers `click-events-have-key-events` and `no-noninteractive-element-interactions`. The visible "Trade" button is the accessible trigger, so either skip the row click or justify a scoped `eslint-disable` with a reason.
- `react-refresh/only-export-components` errors on files that export non-components next to components (lazy consts, hooks). The repo disables it per file or line with a `-- reason`.

## 4. Hand-off for spec 03

Start from an updated `main` on branch `spec/03-instruments`.

- Load the `react-best-practices` skill first.
- Replace only `src/pages/instruments/InstrumentsPage.tsx` (the stub). Keep its default export; `routes.tsx` lazy-loads it.
- Visual reference: session 05 canvas (`Main.dc.html`, `InstrumentsMobile.dc.html`). Table columns ticker + type badge, name, last price, return, "Trade"; mobile cards with a full-width "Trade" button.
- Run lint, typecheck, test, build, `format:check` and `api:types:check`, open the PR with `gh`, summarize against the spec, then stop for review. The user will likely run `/ponytail:ponytail-review` on it.
