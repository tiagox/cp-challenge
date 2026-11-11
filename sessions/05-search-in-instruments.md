---
session: 05
date: 2026-11-11
agent: claude-code
mode: plan
title: App layout and search on the instruments page
status: accepted
related_specs:
  - specs/01-foundation.md
  - specs/02-app-shell-theme-i18n.md
  - specs/03-instruments.md
  - specs/04-search.md
  - specs/06-orders.md
  - specs/07-hardening-docs.md
---

# Session 05 — App layout and search on the instruments page

## 1. Context

Before implementing spec 01 the layout was reviewed with the user on a design canvas:

- Live canvas (private to the owner): https://claude.ai/artifact/8zuvBEiYeoo92pBtH9g8H5
- Copy kept in this repo: [`05-search-in-instruments/canvas/`](./05-search-in-instruments/canvas/). The `.dc.html` files are the canvas's artboards; they need the Design canvas runtime (`support.js`) to render, so read them as source or open the live link. Instrument and search data are real API output from 2026-11-11; portfolio holdings are sample values.

The original plan gave search its own route (`/search`), page, nav item and result list. Reviewing the layout mockups showed the search screen duplicated the instruments screen: same columns, same "Trade" action, same order entry point.

## 2. Decision

Drop the search screen. Add a ticker search box to the instruments page.

- Empty box → full `GET /instruments` list.
- Non-empty box → `GET /search?query=` results, rendered by the same instruments table/cards.
- Query synced with `/instruments?q=`.
- Navigation has two items: Instruments and Portfolio.
- `features/search` keeps the API, query hook and input. `InstrumentsPage` composes the instruments and search features, so features still do not import each other.
- Spec 04 stays in the execution order and now depends on spec 03, because it extends the instruments page.

### Layout approved on the canvas

The canvas draws the spec 02 shell with the spec 01 palette and is the visual reference for specs 02–06:

- Sticky header: brand, nav, theme toggle, language select. Below 768px the nav moves to a fixed bottom bar with icons; the header keeps brand and toggles.
- Content max-width 1200px. Page header: title, muted description, secondary "Refresh" action on the right.
- Instruments: search box (max ~640px) above the list; desktop table (ticker + type badge, name, last price, return, "Trade"), mobile cards with a full-width "Trade" button.
- Portfolio: four summary tiles (2×2 on mobile), "Positions · N" heading, table/cards with an outlined "Sell" button so "Trade" stays the primary action.
- Order ticket: 560px centered modal on desktop (side and type segments side by side, quantity and amount side by side); bottom sheet on mobile, single column, footer with Cancel/Submit. Result strip above the footer with a status badge showing the translated label and raw code, plus the order id.
- Active nav item: tinted background with `--color-accent-text`, not a solid accent fill. Numbers use tabular figures and are right-aligned in tables. Touch targets ≥ 44px.

## 3. Rationale

- Simpler product: one place to browse and find instruments, one fewer route and nav item.
- Less code: no second result list, skeleton or type badge mapping.
- The brief only asks for "un buscador de activos por ticker"; a search box over the list satisfies it and still uses the `/search` endpoint.

## 4. Rejected alternatives

- **Keep a separate `/search` screen.** Duplicates the instruments UI for no user benefit.
- **Filter `/instruments` client-side.** Simpler, but the brief lists `/search` as an endpoint to integrate.
- **Merge spec 04 into spec 03.** Fewer specs, but a larger PR mixing two features; keeping 04 keeps PRs small and the numbering stable.

## 5. Changes to specs

- 01: drop `nav.search`.
- 02: no `/search` route, no `SearchPage` stub, two nav items.
- 03: table/cards are presentational (list + `onSelect` props) so spec 04 can reuse them.
- 04: rewritten as a search box on the instruments page.
- 06, 07, `specs/README.md`, `AGENTS.md`: references updated.
