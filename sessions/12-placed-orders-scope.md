---
session: 12
date: 2026-11-11
agent: claude-code
mode: plan
title: Placed orders list (new spec 07) and hardening renumbered to 08
status: accepted
related_specs:
  - specs/05-portfolio.md
  - specs/06-orders.md
  - specs/07-placed-orders.md
  - specs/08-hardening-docs.md
---

# Session 12 — Placed orders and the spec renumbering

## 1. Context

While spec 06 (PR #7) was in review, the user asked for a "Placed orders" section below the positions on the portfolio page, fed by `GET /orders`. The challenge brief does not mention this endpoint, and `AGENTS.md`, spec 05 §11 and spec 06 §12 listed order history as out of scope. This note records the scope change.

## 2. Decisions

- **New spec 07 — Placed orders.** The old spec 07 (hardening and docs) becomes spec 08 and still runs last. Spec 07 runs after spec 06 is merged.
- **Endpoint facts (checked on the live API).** `GET /orders` returns every order of the candidate, oldest first, `[]` for a new candidate. It needs both headers like `/portfolio`, and ignores query parameters, so there is no server paging or filtering. It is added to `docs/api/openapi.yaml` as `listOrders`.
- **Instrument shown as ticker.** Orders only carry `instrument_id`. The portfolio page also reads the cached instruments list and maps id → ticker; a missing id shows `#<id>`. Rejected: showing only the id (not readable).
- **Newest first, every order.** Sorted on the client by `created_at`, ties by `id`. Rejected: capping to the last N, and keeping the API's oldest-first order.
- **Columns:** date/time, instrument, side, type, quantity, price, total (quantity × price) and status (translated label + raw code). The order id is not shown.
- **Code lives in `features/order`.** It reuses `OrderStatusBadge` and the `orders` namespace. The page layer (`PlacedOrdersSection`) combines it with `features/instruments`, keeping the no feature-to-feature imports rule. Rejected: a separate `features/order-history`, which would force moving the badge to a lower layer.
- **Refresh:** a successful order invalidates `queryKeys.orders` as well as `queryKeys.portfolio`.

## 3. Effect on earlier documents

Earlier specs, sessions and code comments that say "spec 07" about hardening, README, `errorKey` merging or cleanup now mean **spec 08**. They are not rewritten. `AGENTS.md`, `specs/README.md`, `README.md` and the hardening spec itself were updated to the new numbering, and the "no order history" scope rule now only excludes order detail, cancellation and modification.
