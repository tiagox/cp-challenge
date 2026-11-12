---
session: 16
date: 2026-11-12
agent: claude-code
mode: build
title: Resilience to API bug modes
status: accepted
related_specs:
  - specs/05-portfolio.md
  - specs/04-search.md
  - specs/07-placed-orders.md
---

# Session 16 — Resilience to API bug modes

The API injects defects when `X-Enable-Bugs` is `easy`, `medium` or `hard`. The app still sends `off` only. This session checked how the app would behave if it received that data, and fixed the cases where it showed wrong or stale values. Merged as PR #10.

## 1. Already handled

No change was needed for these:

- **`last_price: 0` (easy).** Submit is disabled, validation sets `LAST_PRICE_UNAVAILABLE`, and `floorShares` guards the division.
- **`200` instead of `201` (medium).** `shared/api/http.ts` checks `response.ok`.
- **Fractional quantities floored by the server (medium).** The form rejects them first with `QUANTITY_INTEGER`.
- **SELL without holdings accepted (easy).** The form blocks it with `NO_HOLDING` / `INSUFFICIENT_SHARES`.
- **`GET /orders` rotated (easy).** The list is sorted by `created_at` with `compareNewestFirst`, never reversed.
- **Fills at `close_price`, `PENDING` MARKET orders, stale portfolio reads (hard).** Shown as returned, never corrected optimistically.

## 2. Decisions

- **Search queries are uppercased** in `useSearchInstruments`. In `easy` and above the API matches case-sensitively, so `dyc` returned nothing. Tickers are all uppercase, so this is a no-op in `off`. The query key uses the uppercased value. The UI still shows what the user typed.
- **`profitLoss` returns `number | null`** (`entities/position/model/metrics.ts`). It returns `null` when the result is not finite, for example when `hard` drops `avg_cost_price`. Before, it returned `0`, which rendered as a real break-even.
- **`aggregatePortfolio` returns `profitLoss: null` and `returnPercent: null`** when any holding's P&L is `null`. Before, a holding with no cost added its whole market value to the total profit. `marketValue` and `costBasis` still sum the finite values. This changes spec 05's `PortfolioMetrics` contract.
- **A missing `ticker` is filled in `usePortfolio`'s `select`** with `portfolio.positions.unknownInstrument` (`#{{id}}`, same as `orders.history.unknownInstrument`). Every consumer gets it: the positions table, the cards, the summary, and the order modal opened from a position. `select` is wrapped in `useCallback` keyed on `t`, so it reruns only when the data or the language changes. Rejected: a fallback at each call site. The first version did that, and the review merged the three copies.
- **`usePlacedOrders` polls every 3 s while any order is `PENDING`.** The API answers every LIMIT order as `PENDING` and settles it 0.3–7.4 s later, in all modes including `off`. Before, the list stayed `PENDING` until the window regained focus or the 30 s stale time passed. Polling stops when nothing is pending. It runs only while the placed-orders section is mounted, and not in a background tab.
- **The portfolio is invalidated from the orders `queryFn`** when an order that was `PENDING` in the cached list is no longer `PENDING`. The check compares order ids. A count comparison misses one order settling while another becomes `PENDING` in the same poll. `features/order` uses `queryKeys.portfolio` from `shared`, so no feature imports another.

## 3. Left as is

- In `easy`, the instruments list shows the zero-priced instrument as `ARS 0.00` / `-100.00%`, which is the server's data. Hiding it would take a `last_price <= 0` guard in `returnPercent`.
- In `hard`, an order can be `FILLED` while cash and holdings never changed. The client cannot detect this.
- If an order ever stays `PENDING` for good, the portfolio page polls every 3 s while open. This was not seen in `off`. It was not checked in `hard`.
- Nothing was run against the live API in a bug mode. Coverage is MSW tests: `features/order/queries.test.tsx`, the missing-fields case in `features/portfolio/portfolio.test.tsx`, and the metrics unit tests.
