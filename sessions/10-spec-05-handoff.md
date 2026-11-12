---
session: 10
date: 2026-11-11
agent: claude-code
mode: build
title: Spec 04 implementation notes and hand-off to spec 05
status: accepted
related_specs:
  - specs/04-search.md
  - specs/05-portfolio.md
---

# Session 10 — Spec 04 notes and hand-off to spec 05

## 1. Context

Spec 04 merged as PR #5 (`f897f11`, a squash of five commits). The PR description lists every deviation from the spec. This note keeps the decisions later specs should follow.

Review flow, same as spec 03: the user tried the search, asked for one behaviour change, ran `/ponytail:ponytail-review`, asked to fix every finding, then asked to move the data logic out of the page component.

## 2. Decisions taken during spec 04

- **No `keepPreviousData` (deviates from spec 04 §3 and §5).** The user saw the previous query's results flash before the new response arrived. Every uncached search now shows `InstrumentsSkeleton`. Cached queries still render at once. Prefer a skeleton over stale data in later specs too.
- **Clearing is immediate; only typing is debounced.** An empty box shows the full list and drops `?q=` at once. The debounce delay is `0` while the box is empty (`useDebouncedValue(input, input.trim() ? 300 : 0)`). Without it, typing right after a clear briefly showed the old query and wrote it back to the URL.
- **URL ↔ box sync.** The URL holds the trimmed query and is written only when the debounced query changes (a ref holds the last written value), with `replace: true`. Back/forward copies the URL into the box with the "adjust state during render" pattern, only when it differs from the trimmed box value.
- **Page-local data hook (not in spec 04's file list; asked for in review).** `src/pages/instruments/useInstrumentList.ts` owns the box value, debounce, URL sync and the choice between `useInstruments` and `useSearchInstruments`. It lives in the page layer because it composes two features. `InstrumentsPage` keeps rendering, focus, error copy and the order ticket. Use the same split when a page combines several features' data.
- **Live regions stay mounted.** The "N results for …" line (`role="status"`) is rendered for the whole search and only its text changes. Screen readers can miss a live region that is inserted already filled. It has `min-height: 1lh` so the list doesn't shift when the count appears.
- **Focus after a clear.** Both clear controls (the box's icon button and the empty state's "Clear search") unmount when clicked, so they send focus back to the input. `SearchInput` takes an optional `ref` (React 19 ref-as-prop) for the page's case.
- **The native WebKit search cancel button is hidden**, so the box has one clear control.

## 3. Facts spec 05 depends on

- **Spec 05 §5 asks for a clickable row; spec 03 dropped that at the user's request** (session 09). Positions should match instruments: no row click and no pointer cursor, with "Sell" as the only trigger. Confirm with the user if in doubt, and note it as a deviation in the PR.
- **`errorKey(error)`** is page-local in `InstrumentsPage.tsx`. Spec 05 needs the same mapping. Copy it into `PortfolioPage` (shared and other pages are out of scope); spec 07 can merge the copies if it wants.
- **`InstrumentsSkeleton` renders two `role="status"` elements** (table and cards, toggled by CSS). A skeleton with the same structure in spec 05 does the same. In tests, query by text or use `getAllByRole`.
- **`OrderInstrument.name` is optional**, so the SELL payload in spec 05 §5 (no `name`; `Holding` has none) type-checks as written.

## 4. Test patterns from spec 04

- **Count requests with a fall-through MSW handler:** `server.use(http.get(url, ({ request }) => { record(request) }))`. Returning nothing passes the request on to the next handler, and `resetHandlers` removes it after the test. Handlers added with `server.use` run first, so the recorder also sees requests that a one-shot error handler answers.
- **Holding a response:** wait for the request to start before releasing it (`await waitFor(() => expect(respond).toBeDefined())`). Calling `respond()` too early leaves the request hanging, and the test passes or fails depending on timing.
- **Back/forward in tests:** render a harness inside `renderWithProviders` with buttons that call `navigate(...)` / `navigate(-1)`, plus an `<output>` showing `location.pathname + location.search`. A module-level `navigate` variable fails the `react-hooks/globals` lint rule.

## 5. Hand-off for spec 05

Start from an updated `main` on branch `spec/05-portfolio`.

- Load the `react-best-practices` skill first.
- Expose `usePortfolio` from `@/features/portfolio` exactly as spec 05 §3 shows. Spec 06 depends on it.
- Use `entities/position` for every metric; do not repeat the formulas.
- Run lint, typecheck, test, build, `format:check` and `api:types:check`. Open the PR with `gh`, summarize it against the spec, then stop for review. Expect `/ponytail:ponytail-review` and a browser check from the user.
