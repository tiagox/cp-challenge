---
session: 01
date: 2026-11-10
agent: claude-code
mode: plan
title: Plan grilling — refinements to the session 00 decisions
status: accepted
related_specs:
  - specs/README.md
  - specs/01-foundation.md
  - specs/02-app-shell-theme-i18n.md
  - specs/03-instruments.md
  - specs/04-search.md
  - specs/05-portfolio.md
  - specs/06-orders.md
  - specs/07-hardening-docs.md
---

# Session 01 — Plan grilling

## 1. Context

Before any code was written, the plan from session 00 was stress-tested question by question with the user. This note records what changed and why. The specs, `specs/README.md` and `AGENTS.md` were updated in the same session so they agree with it; no implementation existed yet, so updating the specs directly was preferred over leaving them stale.

## 2. Evaluation target

**Decision:** reviewers grade both the product and the process. `specs/` and `sessions/` are part of the deliverable. Budget: about 1–2 days.

**Consequence:** the ambitious scope from session 00 (EN/ES, themes, OpenAPI contract) stays. Only low-value pieces are cut (see §9).

## 3. Bug modes

**Decision:** the app always sends `X-Enable-Bugs: off`. `VITE_API_BUG_MODE` stays as an env var defaulting to `off`. No QA pass, fixtures or planning target any other mode.

**Rejected:** hardening against `hard`-mode data as a hidden evaluation criterion. The user chose not to plan for it; the existing division guards and `—` rendering remain.

## 4. Default language

**Decision:** `es` is the default and fallback; `en` is a full second language.

Detection: stored `ccs.lang` → first browser language starting with `es` or `en` → `es`.

**Rationale:** the brief is in Spanish, the company is Argentine and prices are in ARS. The browser step now matches both supported languages; otherwise, with an `es` fallback, browser detection would never pick anything.

**Rejected:** keeping `en` as the default (session 00).

## 5. Empty portfolio on first visit

**Decision:** accepted. A new candidate starts with `{ cash: 1000000, holdings: [] }`. The portfolio screen shows the cash summary, an explanation and a call to action to Instruments. The README documents pinning `VITE_CANDIDATE_ID` to a candidate that already has holdings.

**Rejected:** seeding holdings by placing orders automatically; a shared fixed candidate for all reviewers.

## 6. Rejections

**Decision:** the client blocks avoidable invalid orders. Server `400 { error }` responses are shown in the result region as a localized "Order rejected" message with the reason. A real `REJECTED` status is shown the same way if one ever arrives. The README notes that the brief describes `REJECTED` while the API returns `400`.

## 7. Amount → shares for LIMIT orders

**Decision:** shares always come from `floor(amount / last_price)`, as the brief requires, including for LIMIT orders. For LIMIT, the amount field shows `orders.hints.amountLimit`, explaining why the estimated total at the limit price can differ from the typed amount.

**Rejected:** deriving shares from the limit price; it contradicts the brief's “utilizando el último precio”.

## 8. Execution and git workflow

**Decision:** one agent runs the specs strictly in order, 00 → 07. Each spec gets one branch (`spec/NN-<name>`) and one PR, opened with `gh`. The agent stops there; the user reviews and squash-merges before the next spec branches from `main`.

Kept: per-feature i18n namespaces, feature boundaries, spec 02 stubs (every intermediate state runs) and the “Files owned” lists, now a scope guide for reviewers rather than a hard contract.

Removed: “can run in parallel” columns and wording that only justified parallel work.

**Rationale:** the stages exist to make the work understandable, not to parallelize it. One squash commit per spec gives `main` a readable history; the PRs keep the detail.

## 9. Scope cut

**Decision:** drop the static copy-audit test (`src/test/copy-audit.test.ts`) from spec 07. Hardcoded copy is caught by review, typed `t()` keys and the EN/ES parity test.

**Rationale:** session 00 already flagged it as noisy. i18n, themes, OpenAPI and codegen are visible to the reviewer and stay.

## 10. Tests and language

**Decision:** `renderWithProviders` takes a `lang` option and defaults to `en`, so the specs' English assertions stay valid even though the app defaults to `es`. Every feature keeps at least one Spanish test.

## 11. Deployment

**Decision:** spec 07 adds `vercel.json` (SPA rewrite to `index.html`), checks that `npm run build` produces a deployable `dist/`, and adds a “Live demo” README section with a link placeholder. The user connects the repo in Vercel without setting `VITE_CANDIDATE_ID`, so every reviewer gets a fresh candidate, then fills in the link.

## 12. Decision records

Session notes stay in `sessions/NN-<topic>.md`. `docs/adr/` (configured for the engineering skills) stays unused unless a long-lived architectural decision comes up.
