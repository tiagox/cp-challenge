---
session: 17
date: 2026-11-12
agent: claude-code
mode: build
title: Hidden debug panel for bug mode and candidate
status: accepted
related_specs:
  - specs/00-api-contract.md
  - specs/02-app-shell-theme-i18n.md
---

# Session 17 — Debug panel

To try the API bug modes (session 16) and switch candidates without editing `.env`, the app has a hidden debug panel.

## Decisions

- **`?debug` turns debug mode on, `?debug=off` turns it off.** The flag persists in `localStorage["cp.debug"]`. The panel's "Turn off debug" link also clears it.
- **A light-gray bug button sits bottom-right**, above the mobile bottom nav. It opens a native `popover` card, so Esc, click-outside and toggling need no state.
- **`X-Enable-Bugs` is read on every request** through `resolveBugMode()` in `shared/api/config.ts`: valid `localStorage["cp.bugMode"]` → `VITE_API_BUG_MODE` → `off`. It replaces the `API_BUG_MODE` constant. Choosing `off` or turning debug off removes the stored mode.
- **The candidate field writes the existing `cp.candidateId` key.** `VITE_CANDIDATE_ID` still wins, so the field is disabled with a hint when it is set.
- **Every change calls `queryClient.resetQueries()`** so all screens refetch with the new headers.
- **Works in production builds.** This is a deliberate exception to "never expose easy/medium/hard": the modes are reachable only through `?debug`, never from the normal UI. The default stays `off`.
- Header names and mode values are shown literally (protocol values). The other labels go through `t()` under `common.debug`.

## Rejected

- **Dev builds only (`import.meta.env.DEV`).** The deployed demo is where reviewers would want it.
- **A separate debug-only candidate key.** Reusing `cp.candidateId` means the chosen candidate sticks after debug is turned off, which is what switching candidates is for.
- **The house `Input` component.** It is 48 px tall; the panel uses small native controls.

## Left as is

- jsdom 31 hides `[popover]` but does not open it from `popovertarget`, so `DebugPanel.test.tsx` queries the panel controls with `hidden: true` and drives them with `fireEvent`.
- The 375 px placement was not checked in a real browser.
