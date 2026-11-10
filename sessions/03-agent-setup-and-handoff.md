---
session: 03
date: 2026-11-10
agent: claude-code
mode: plan
title: Agent setup decisions and hand-off to the build sessions
status: accepted
related_specs:
  - specs/README.md
  - specs/00-api-contract.md
  - specs/01-foundation.md
---

# Session 03 — Agent setup and hand-off

## 1. Context

The same planning session that produced sessions 01 and 02 also changed how agents work in this repo. Those changes are committed but had no decision record. This note records them and hands off to the session that starts spec 00.

## 2. Agent skills configuration

**Decision:** the engineering skills are configured in `docs/agents/`, referenced from the `## Agent skills` section of `AGENTS.md`.

- **No issue tracker.** The specs in `specs/` define the work. When a skill would publish an issue, it shows the output in the conversation and asks where to save it; when it needs a ticket, it uses the assigned spec. See `docs/agents/issue-tracker.md`.
- **No triage labels.** Triage isn't used in this repo.
- **Domain docs are single-context:** `GLOSSARY.md` and `docs/adr/` at the repo root, created lazily by `/domain-modeling`. See `docs/agents/domain.md`.

**Decision records:** session notes stay in `sessions/NN-<topic>.md`. `docs/adr/` is only for a long-lived architectural decision that outlives a session.

**Rejected:** GitHub Issues (not used for this challenge); pointing the skills at `sessions/` as the ADR folder (the user chose `docs/adr/`).

## 3. `notes/` renamed to `sessions/`

**Decision:** the decision-record folder is `sessions/`, matching what it holds: one record per AI agent session. All path references in `AGENTS.md` and the specs were updated; wording around them ("session note", "Notes convention") was left as is.

## 4. React best-practices skill

**Decision:** `.claude/skills/react-best-practices/` (Vercel's guide, installed via `claude-code-templates`) is loaded before writing, reviewing or refactoring React code, from spec 02 onwards.

The skill targets Next.js; this repo is a Vite SPA. `AGENTS.md` maps it, and the specs win on conflict:

- Server rules, `async-api-routes` and `rendering-hydration-no-flicker` don't apply (no server rendering; the boot script prevents flicker).
- SWR → TanStack Query; `better-all` → `Promise.all` or dependent queries; `next/dynamic` → `React.lazy`.
- `bundle-barrel-imports` applies to third-party libraries only. Each feature's public `index.ts` is the layer boundary and stays.
- No reflexive memoization.

**Rejected:** applying the skill as-is (it would pull in SWR, `better-all` and `next/dynamic`, which break the stack rules).

## 5. Hand-off for spec 00

Start from a clean `main` on branch `spec/00-api-contract`.

- **Missing dependency in spec 00.** `src/shared/api/queryClient.ts` imports `QueryClient`, but spec 00's install list doesn't include `@tanstack/react-query`. Install the version spec 01 pins (`@tanstack/react-query@5.107.1`) in spec 00 and say so in the PR.
- **The repo isn't empty.** `npm create vite@latest . -- --template react-ts` will stop to ask about existing files (`AGENTS.md`, `docs/`, `specs/`, `sessions/`, `.claude/`). Scaffold into a temporary folder and copy the scaffold files in; don't let it overwrite or delete anything.
- **Existing API docs.** `docs/api/postman/` already holds a Postman collection and its README (commit `04abdca`). Spec 00's `docs/api/README.md` should link to it, not duplicate it.
- **Environment checked on 2026-11-10:** Node 26.12.1, npm 11.20.0 (meets `>=22`). Latest on npm: `create-vite` 9.3.4, `vite` 8.3.7, `react` 19.3.1, `@vitejs/plugin-react` 6.3.0, `@fontsource-variable/plus-jakarta-sans` 5.3.0.
- **Workflow (session 01):** one agent, specs strictly in order, one branch and one PR per spec, opened with `gh`. Then stop: the user reviews and squash-merges before the next spec.
- **Read first:** `AGENTS.md`, `specs/README.md`, sessions 00–03, then spec 00.
