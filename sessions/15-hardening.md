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

## 2. Simplification pass (whole-code review)

A review of all of `src/` removed code that no caller uses, even where a spec lists it. These change earlier specs' contracts:

- **UI kit (spec 02):** removed Button `ghost`/`danger` variants and `rightIcon`; Modal `size` and `className` (the modal is always 560 px wide); Skeleton `circle`; Spinner `label`/`className`; Badge `icon`/`className`; EmptyState `icon`/`className`; PageHeader `className`; SegmentedControl `disabled`; Card `as="section" | "li"`.
- **`ErrorState` takes `{ error, onRetry }`.** It shows `errors.unexpected` as the title and maps the error with `errorKey`; `title`, `description`, `retryLabel` and `className` are gone. The order modal now passes the portfolio query's `error` (`portfolioError`) instead of `portfolioStatus`, so its error state reads like the pages' (network/timeout/server message) instead of the generic "Something went wrong / Please try again."
- **`MoneyText` and `PercentText` color by sign.** `MoneyText signed` shows the sign and colors the value; `PercentText` is always signed and colored. Zero is neutral in both, so a break-even P&L is no longer green. `signTone` in `shared/lib/math.ts` holds the rule.
- **Ticket state (specs 02 and 06):** `isOpen` removed; the ticket is open when `instrument` is set.
- **Order validation (spec 06):** `amount` input and the `'amount'` field key removed; validation never read them.
- **Theme context (spec 02):** `setTheme` removed; only `toggleTheme` is used.
- **HTTP client (spec 00):** `timeoutMs` option removed; the 15 s timeout is a constant.
- `returnOnCost` reuses `returnPercent` (same formula, different base). Queries no longer repeat the default `staleTime`. The order side lives only in `OrderModal`; `OrderForm` receives it.
- Test helpers used in several files (`rowFor`, `captureOrders`, `stubPrefersDark`, `runBootScript`) live in `src/test/helpers.ts`.

## 3. Browser QA fixes

The manual pass in Chrome (production build, live API) found two defects that the jsdom tests missed:

- **A double-click placed two orders.** `OrderModal` guarded on `mutation.isPending`, which only flips after the next render. It now uses a ref, set before `mutate`; the ticket allows one order per opening anyway. Test: two `submit` events in the same tick send one request.
- **Closing the order modal lost focus.** Radix modal dialogs only return focus to a `Dialog.Trigger`, and our dialogs open from context. `Modal` records the focused element in `onOpenAutoFocus` and focuses it again in `onCloseAutoFocus`. This also covers the order ticket, which unmounts on close. Tests in `modal.test.tsx` and `OrderModalContainer.test.tsx`.

Also seen: the live API lists orders rejected later (`REJECTED`) in `GET /orders`, which answers the open question in session 14.

## 4. Left as is

- `src/features/instruments/instruments.test.tsx` and `src/features/portfolio/portfolio.test.tsx` import `useOrderTicket` from the order feature. These are tests checking the open-ticket call, not product code; the layer rule holds for `src/` app code.
