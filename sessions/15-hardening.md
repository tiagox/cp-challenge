---
session: 15
date: 2026-11-12
agent: claude-code
mode: build
title: Spec 08 hardening notes
status: accepted
related_specs:
  - specs/08-hardening-docs.md
---

# Session 15 — Spec 08 hardening notes

## 1. Decisions

- **The rejection flow test asserts "close and reopen", not "form stays usable".** Spec 08 §4 flow 4 says the form remains usable after a `400`. Since session 13 the result view offers only Close (no "New order"), so the form is not on screen after a rejection. The test closes the modal and checks that Trade reopens a fresh, enabled form. Rejected: bringing back "New order", which would change feature behavior in a hardening spec.
- **`renderApp` returns its memory router** (`src/test/render.tsx`, spec 01's file) so the search flow can assert `?q=` on the router location. Rejected: a second, copied provider tree inside the test.
- **`common.comingSoon` was removed** from EN and ES; nothing used it after the page stubs were replaced.
- **`errorKey` lives in `src/shared/api/errors.ts`.** The instruments page and the portfolio page each had a copy (session 14 §4). The function only maps `ApiError` codes to `errors.*` keys, so it sits next to `ApiError` in `shared`, where both pages import it.
- **Shared list styles are Sass mixins in `src/app/styles/_mixins.scss`**: `data-table` (with `$sticky-head`), `desktop-only`, `mobile-only`, `card-list`, `card-body`, `card-metrics` and `list-skeleton`. The instruments, positions and orders tables, both card lists and both skeletons use them, and each module keeps its own class names. The compiled CSS has the same rules as before. Rejected: a shared UI component (`shared/ui/DataTable`), which would change markup in a hardening spec.
- **`.env` added to `.gitignore`.** The README now says `cp .env.example .env`; before, only `*.local` was ignored.

## 2. Left as is

- `src/features/instruments/instruments.test.tsx` and `src/features/portfolio/portfolio.test.tsx` import `useOrderTicket` from the order feature. These are tests checking the open-ticket call, not product code; the layer rule holds for `src/` app code.
