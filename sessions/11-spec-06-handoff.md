---
session: 11
date: 2026-11-11
agent: claude-code
mode: build
title: Spec 05 implementation notes and hand-off to spec 06
status: accepted
related_specs:
  - specs/05-portfolio.md
  - specs/06-orders.md
---

# Session 11 — Spec 05 notes and hand-off to spec 06

## 1. Context

Spec 05 merged as PR #6 (`e83a696`). The PR description lists every deviation from the spec. This note keeps the decisions that later specs should follow.

The review flow matched specs 03 and 04. The user ran `/ponytail:ponytail-review` and asked for both findings to be fixed. They then checked the screen in a browser against a temporary local mock, which was never committed.

## 2. Decisions taken during spec 05

- **No row click (deviates from spec 05 §5).** This matches the instruments table (session 09). "Sell" is the only trigger, on desktop and on mobile. Hovering a row still tints it, as on instruments.
- **"Sell" buttons have an `aria-label`** from `portfolio.actions.sellTicker` ("Sell DYCA"), while the visible text stays "Sell". In tests, query them as `getByRole('button', { name: 'Sell DYCA' })`.
- **`errorKey(error)` is a copy** of the one in `InstrumentsPage`. Spec 07 can merge the two.
- **The empty-state CTA is a `Link` styled like the primary `Button`**, in `PortfolioPage.module.scss`. The shared `Button` renders only a `<button>`, and shared UI was out of scope. Spec 07 may add link support to `Button` and drop that copy.
- **The skeleton reuses `PortfolioSummary.module.scss`'s `.grid` class**, so the summary layout lives in one place (ponytail-review finding).
- **The summary has 4 columns from `lg` (1024px), not `md`.** At 768px, `ARS 1,000,000.00` does not fit a quarter of the width.
- **P&L is signed** (`+ARS 50.70`), and its tone is positive when `>= 0`, as spec 05 §4 says.
- **`src/features/portfolio/ui/portfolio.module.scss` was not created**, because nothing needed it.

## 3. Facts spec 06 depends on

- **`usePortfolio()`** is exported from `@/features/portfolio` and uses `queryKeys.portfolio` with `staleTime: 30_000`. `OrderModalContainer` should read `data`, `status` and `refetch` from it, as spec 06 §3 shows.
- **The SELL preset** from the portfolio calls `open({ instrument: { id, ticker, last_price }, side: 'SELL', quantity })`. `instrument.name` is `undefined` there, so the modal must not depend on a name.
- **The portfolio page keeps its data during a background refetch**: it renders data first, then the error, then the skeleton. Invalidating `queryKeys.portfolio` after an order refreshes the page without flashing the skeleton.
- **Both the summary and the mobile cards render a `<dl>`.** Portfolio tests scope summary lookups to the first `<dl>`. A modal rendered in a portal does not change that.

## 4. Hand-off for spec 06

Start from an updated `main` on branch `spec/06-orders`.

- Load the `react-best-practices` skill first.
- Replace only the body of `src/app/layout/OrderModalContainer.tsx`. Keep its path and export name.
- The order feature must not import `@/features/portfolio`. Portfolio data reaches `OrderModal` through props from the container.
- Run lint, typecheck, test, build, `format:check` and `api:types:check`. Open the PR with `gh`, summarize it against the spec, then stop for review. Expect `/ponytail:ponytail-review` and a browser check from the user.
