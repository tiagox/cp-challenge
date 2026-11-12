---
session: 13
date: 2026-11-11
agent: claude-code
mode: build
title: Spec 06 implementation notes and hand-off to spec 07
status: accepted
related_specs:
  - specs/06-orders.md
  - specs/07-placed-orders.md
---

# Session 13 — Spec 06 notes and hand-off to spec 07

## 1. Context

Spec 06 merged as PR #7 (`e31f60f`). The PR description lists every deviation from the spec. The user ran `/ponytail:ponytail-review` and asked for both findings to be fixed, then asked for four behavior changes during review. Spec 07 (placed orders) was written in the middle of that review; see session 12.

## 2. Decisions taken during spec 06

- **No "New order" button (deviates from spec 06 §7).** After a result the footer shows only Close. The `orders.actions.newOrder` key was removed from EN/ES.
- **The modal cannot close while the order request is pending.** Cancel is disabled, and `OrderModal`'s `onOpenChange` ignores Esc, overlay click and the header X. The X still looks enabled, because the shared `Modal` has no prop to disable it. Spec 08 may add one.
- **Form layout:** Buy/Sell on its own full-width row, then quantity and amount (two columns from `sm`), then Market/Limit full width, then the limit price for LIMIT, then the summary.
- **Sell limits.** The Sell option is disabled when the portfolio holds none of the instrument. While Sell is selected, quantity is capped at the shares held: typing more, typing an amount worth more, or switching from Buy all set it to the holding. When the cap comes from the amount field, the typed amount is left as is; the estimated total shows the real value.
- **The result renders in an always-mounted `aria-live` region** in `OrderModal`, so screen readers announce it (ponytail-review finding).
- **Result state is read from the mutation** (`data` / `error`), with no separate `result` or `lastEdited` state.
- **`INSUFFICIENT_CASH` and `INSUFFICIENT_SHARES` are reported on `quantity`**; `NO_HOLDING` and `LAST_PRICE_UNAVAILABLE` on `form`.
- **Extra key `orders.result.details`** labels the `<details>` that holds the raw server message.
- **`OrderModalContainer` fetches the portfolio only while the ticket is open**, through an inner component.
- **`src/features/order/ui/order.module.scss` was not created.**

## 3. Facts spec 07 depends on

- **`OrderStatusBadge`** is in `src/features/order/ui/OrderStatusBadge.tsx` and takes `{ status }`. It is not exported from `index.ts` yet; spec 07 uses it from inside the feature.
- **`useCreateOrder`** is in `src/features/order/mutations.ts`. It invalidates `queryKeys.portfolio` in `onSuccess`; spec 07 adds `queryKeys.orders` next to it.
- **The invalidation test** is `invalidates the portfolio after a successful order` in `src/features/order/orderModal.test.tsx`. It spies on `queryClient.invalidateQueries`; extend it rather than adding a new one.
- **Test patterns:** the header X and the footer button are both named "Close", so pick the footer one with `getByText('Close', { selector: 'button' })`. The submit button's name while pending includes the spinner's "Loading...", so query it with `/Submitting/`. `captureOrders()` in the modal test shows how to record request bodies and fall through to the default MSW handler.
- **The no-retry test** uses a `QueryClient` whose default would retry. It fails if `retry: false` is removed; keep that guard when editing `mutations.ts`.

## 4. Hand-off for spec 07

Start from an updated `main` on branch `spec/07-placed-orders`.

- Load the `react-best-practices` skill first.
- Read session 12 and `specs/07-placed-orders.md`.
- Run lint, typecheck, test, build, `format:check` and `api:types:check`. Open the PR with `gh`, summarize it against the spec, then stop for review. Expect `/ponytail:ponytail-review` and a browser check from the user.
