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
- **`.env` added to `.gitignore`.** The README now says `cp .env.example .env`; before, only `*.local` was ignored.

## 2. Left as is

- The two `errorKey` copies (instruments and portfolio pages) and the table/card/skeleton styles duplicated between the portfolio and order features (session 14 §4). Merging them is a refactor with no QA failure behind it; spec 08 §14 rules out refactors that QA does not need.
- `src/features/instruments/instruments.test.tsx` and `src/features/portfolio/portfolio.test.tsx` import `useOrderTicket` from the order feature. These are tests checking the open-ticket call, not product code; the layer rule holds for `src/` app code.
