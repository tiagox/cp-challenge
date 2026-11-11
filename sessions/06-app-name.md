---
session: 06
date: 2026-11-11
agent: claude-code
mode: build
title: The UI does not mention Cocos
status: accepted
related_specs:
  - specs/01-foundation.md
  - specs/02-app-shell-theme-i18n.md
---

# Session 06 — The UI does not mention Cocos

## 1. Context

Spec 01 §8.3 set `common.appName` to `Cocos Invest`, which the header brand (spec 02) and the page `<title>` display. The theme rules already said to borrow only the cocos.capital palette and font, with no Cocos logo, name or imagery; the app name contradicted that.

## 2. Decision

The product name is **CP Invest** in both languages.

- `common.appName` is `CP Invest` in EN and ES (spec 01 §8.3 updated).
- `index.html` `<title>` is `CP Invest`. Spec 02's boot script and any later title handling keep it.
- No user-facing string, `aria-label`, title or asset mentions Cocos.
- The layout canvas (session 05, live and repo copy) shows the new name.

Out of scope: `docs/api/**` and the Postman collection call the external service "Cocos Challenge API". That names the third-party API in developer docs, never reaches the UI, and spec 01 forbids editing those files.

## 3. Rejected alternatives

- **Keep `Cocos Invest`.** Implies an affiliation with Cocos the app does not have.
- **A fully generic name (`Mercado`, `Inversiones`).** The user chose `CP Invest`, matching the `cp.` storage-key prefix.
