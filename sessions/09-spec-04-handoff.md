---
session: 09
date: 2026-11-11
agent: claude-code
mode: build
title: Spec 03 implementation notes and hand-off to spec 04
status: accepted
related_specs:
  - specs/03-instruments.md
  - specs/04-search.md
---

# Session 09 — Spec 03 notes and hand-off to spec 04

## 1. Context

Spec 03 merged as PR #4 (`49d565c`, a squash of four commits). The PR description lists every deviation from the spec. This note keeps the ones spec 04 depends on.

After implementation the user ran `/ponytail:ponytail-review`, asked to fix every finding, and then checked the page in a real browser at 375, 768 and 1280 px.

## 2. Decisions taken during spec 03

- **No row click (deviates from spec 03 §4 and §9).** The user asked for it during review: table rows are not clickable and have no pointer cursor. The "Trade" button is the only trigger on desktop and mobile, and it is `primary` in both. Rows keep their hover/focus-within highlight.
- **Desktop/mobile switch uses CSS only.** `InstrumentsTable`, `InstrumentsCards` and `InstrumentsSkeleton` render both layouts, and each one hides itself at 768 px (`respond-to(md)`). There is no `useMediaQuery` call. `display: none` also hides the inactive list from assistive tech.
- **State order in `InstrumentsPage`:** `data` first (empty state or list), then `error && !isFetching` (ErrorState), else the skeleton. Checking `data` first keeps the list on screen when a background refetch fails. `!isFetching` shows the skeleton while a retry runs instead of a frozen error.
- **Error copy mapping** lives in a page-local `errorKey(error)`: `NETWORK` maps to `errors.network`, `TIMEOUT` to `errors.timeout`, anything else to `errors.server`. The title is `errors.unexpected`.
- **Count:** `PageHeader` has no `count` prop, so `instruments.count` is rendered in its `actions` slot (`.count` in `InstrumentsPage.module.scss`), only while data is present.
- **`overflow-x: clip` in `globals.scss`** (was `hidden` on `html` and `body`). With `hidden` on both, `body` became a scroll container that never scrolls, so neither the app header nor the table header could stick. The user confirmed the fix in the browser. Do not change it back to `hidden`.
- **Grid trap on mobile:** a grid with an `auto` column grows to fit its min-content width. A truncated (`nowrap`) name then pushes cards past the viewport, and `clip` hides the overflow without a scrollbar. `InstrumentsCards` uses `grid-template-columns: minmax(0, 1fr)` on the list and on each card. Do the same in any new grid that holds truncated text.
- **Sticky `thead`** uses `top: 65px` (64 px app header plus a 1 px border at md and up). It is hardcoded because there is no header-height token.
- **Zero return** renders `+0.00%` in neutral colour. This is the existing `PercentText` `signed` behaviour.
- **Not created:** `ui/instruments.module.scss` and `ui/InstrumentTypeBadge.module.scss`. Each component styles itself.
- **Outside the owned files:** `src/test/app-shell.test.tsx` now asserts the instruments table renders instead of the stub text, plus the `globals.scss` change above.

## 3. Facts spec 04 depends on

### Instruments feature (`@/features/instruments`)

- Exports `useInstruments`, `InstrumentsTable`, `InstrumentsCards` and `InstrumentsSkeleton`. The table and cards take `{ instruments, onSelect }`. The skeleton takes no props.
- The table has a visually hidden `<caption>` with `instruments.title`, so `getByRole('table', { name: 'Instruments' })` finds it. Every row has a `rowheader` whose name starts with the ticker (the type badge follows it).
- Each mobile card is an `<article>` with an `h2` holding the ticker and badge.
- **`InstrumentsSkeleton` renders `role="status"`** with a visually hidden `common.loading`. Spec 04 adds a results status line with `role="status"`, so tests must query statuses by name or text, not with a bare `getByRole('status')`.

### Page (`src/pages/instruments/InstrumentsPage.tsx`)

- `handleSelect` builds the BUY `open()` payload. Pass the same function to the search results.
- Reuse `errorKey` for search errors (spec 04 §5 asks for the same mapping), and keep the data-first order for the search source.

### Tests

- Spec 03's tests live in `src/features/instruments/instruments.test.tsx` and render `InstrumentsPage` directly. They use `screen.findByRole('table')`, a `rowFor(table, ticker)` helper and a `TicketState` consumer. They must keep passing once the page reads `useSearchParams`. `renderWithProviders` already wraps a `MemoryRouter`, and `route` sets the initial URL (e.g. `/instruments?q=dy`).
- The retry test holds the second response with a manual promise to assert the skeleton. Copy that pattern if spec 04 needs to assert the "keep previous results" state.
- `src/test/app-shell.test.tsx` asserts `getByRole('table', { name: 'Instruments' })` at `/instruments`.
- The MSW `/search` handler filters the fixture by ticker substring, case-insensitively. `?query=dy` returns only `DYCA`.

## 4. Hand-off for spec 04

Start from an updated `main` on branch `spec/04-search`.

- Load the `react-best-practices` skill first.
- Extend `InstrumentsPage`; do not copy the table, cards or skeleton. `features/search` must not import `features/instruments`.
- Put the search box between `PageHeader` and the list. Size it with `minmax(0, …)` or `min-width: 0` so it can't overflow at 375 px.
- Run lint, typecheck, test, build, `format:check` and `api:types:check`. Open the PR with `gh`, summarize it against the spec, then stop for review. Expect `/ponytail:ponytail-review` and a browser check from the user.
