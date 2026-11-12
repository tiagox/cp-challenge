---
session: 14
date: 2026-11-12
agent: claude-code
mode: build
title: Spec 07 implementation notes and hand-off to spec 08
status: accepted
related_specs:
  - specs/07-placed-orders.md
  - specs/08-hardening-docs.md
---

# Session 14 — Spec 07 notes and hand-off to spec 08

## 1. Context

Spec 07 was implemented in PR #8. After the PR was opened, the user asked for three changes to the section. They change decisions written in spec 07, which is not rewritten; this note is the record.

## 2. Decisions changed during review

- **The section is called "Activity" / "Actividad"** (`orders.history.title`), not "Placed orders" / "Órdenes enviadas" (spec 07 §9). Code names (`PlacedOrdersSection`, `PlacedOrdersTable`, `usePlacedOrders`, `orders.history.*`) were kept. Rejected: renaming files and keys, which would be churn with no user-visible effect.
- **The side reads "Compra" / "Venta" in a column called "Operación"** in Spanish. The list uses its own `orders.history.side.BUY|SELL` keys (EN: "Buy" / "Sell"), not `orders.side.*` (spec 07 §7). Reason: `orders.side.*` are the order modal's action labels ("Comprar" / "Vender"); a past order is a noun. The EN column stays "Side".
- **The section is collapsible.** The `<h2>` wraps a disclosure button (`aria-expanded`, `aria-controls`) with a chevron; the list sits in a `hidden` wrapper. The heading and the count stay visible when collapsed. It starts expanded and the state is not persisted. Rejected: native `<details>`/`<summary>`, because a heading inside `<summary>` loses its heading role in some screen readers.

## 3. Other implementation facts

- **`src/features/portfolio/portfolio.test.tsx` was edited** although spec 07 §11 said to leave it unchanged: with two tables and two loading `status` regions on the page, its unnamed queries became ambiguous. Only the queries were narrowed (`{ name: 'Positions' }`, first `status`).
- **The orders table header is not sticky.** The table scrolls horizontally inside its own box at narrow desktop widths, where `position: sticky` does not stick to the page.
- **The count shows only once data has loaded.**
- **Dates:** `formatDateTime` output matched spec 07 §5 exactly (plain spaces) on the Node/ICU used. Tests run with `TZ=UTC` (`vitest.config.ts`).
- **`errorKey`** now lives in `src/pages/portfolio/errorKey.ts`; the instruments page still has its own copy.

## 4. Hand-off for spec 08

- Treat the copy and the collapse toggle above as intended; do not restore the spec 07 wording.
- Not verified: whether the live API lists orders rejected with `400` in `GET /orders`. The app refreshes the list only after a successful (`201`) order.
- Merge candidates for hardening: the two `errorKey` copies, and the table/card/skeleton styles copied from the portfolio feature into the order feature.
