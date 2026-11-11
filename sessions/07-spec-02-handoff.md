---
session: 07
date: 2026-11-11
agent: claude-code
mode: build
title: Spec 01 implementation notes and hand-off to spec 02
status: accepted
related_specs:
  - specs/01-foundation.md
  - specs/02-app-shell-theme-i18n.md
---

# Session 07 — Spec 01 notes and hand-off to spec 02

## 1. Context

Spec 01 merged as PR #2 (`a681651`). This session also produced sessions 05 (search on the instruments page, layout canvas) and 06 (app name `CP Invest`). Some implementation facts from spec 01 live only in the PR description; this note puts them where the next session reads them.

## 2. Spec 01 facts the next specs depend on

### Tooling

- **ESLint 10 + `eslint-plugin-jsx-a11y`.** The plugin's latest release (6.10.2, Oct 2024) declares `eslint ≤9`. `package.json` has `overrides: { "eslint-plugin-jsx-a11y": { "eslint": "$eslint" } }`. Verified: its rules (`alt-text`, `click-events-have-key-events`, …) report under ESLint 10. Do not remove the override or downgrade ESLint.
- **Prettier covers code and config only.** `.prettierignore` excludes `docs`, `specs`, `sessions`, `.claude`, `AGENTS.md`, `frontend-challenge.md`. `npm run format` is safe to run; it will not touch docs.
- **TypeScript:** `strict` and `noUncheckedIndexedAccess` are on. Index access returns `T | undefined`; destructure or guard instead of `!`.
- `npm install` warns about install scripts for `@parcel/watcher` and `fsevents`. Both are optional (Sass watch mode, macOS file events); the warning is harmless.

### Styles

- `src/app/styles/_tokens.scss` **emits no CSS by itself**. `globals.scss` outputs the custom properties once via `@include tokens.css-variables`. CSS Modules use:
  ```scss
  @use '@/app/styles/mixins' as *;
  ```
  Verified: Vite resolves the `@/` alias in Sass, and a module compiled this way contains no token declarations.
- Mixins: `respond-to($bp)` (mobile-first `min-width`; accepts `sm|md|lg|xl` or a length), `focus-ring`, `visually-hidden`, `truncate`, `card-surface`.
- Extra tokens beyond the spec table, for status badges: `--color-{positive,negative,warning,info}-tint`.
- Use Sass modules (`sass:map`, `map.get`), not global built-ins or `if()`: Sass 1.108 prints deprecation warnings for those.

### i18n

- The configured instance is exported as `i18n` from `@/shared/i18n` (it is the default `i18next` instance). `src/main.tsx` imports `./shared/i18n` for its side effect.
- `changeLanguage(locale)` in `@/shared/i18n/language` is the only path that persists `cp.lang`; the language switcher must call it, not `i18n.changeLanguage`.
- `resolveInitialLanguage()` is the rule the spec 02 boot script must mirror: stored `cp.lang` (`en`|`es`) → first `navigator.languages` entry whose first two letters are `en`/`es` → `es`.
- `nav` has no `search` key (session 05). Navigation is Instruments and Portfolio only.
- Feature namespaces (`instruments`, `portfolio`, `search`, `orders`, `validation`) are empty objects; each feature spec fills its own.
- `common.appName` is `CP Invest` (session 06). `index.html` has `<html lang="es">` and `<title>CP Invest</title>`; spec 02 adds the boot script.

### Tests

- MSW 3 renamed `onUnhandledRequest` to `onUnhandledFrame`; `src/test/setup.ts` uses `onUnhandledFrame: 'error'`.
- Handlers in `src/test/msw/handlers.ts` reject a missing/non-`off` `X-Enable-Bugs` and a missing `X-Candidate-Id` on every endpoint. Override per test with `server.use(...)`.
- To test handlers without the HTTP client, use MSW's `getResponse(handlers, request)`; never call `fetch` directly (spec 07 audits `fetch(` outside `http.ts`).
- `renderWithProviders(ui, { route, lang })` wraps `QueryClientProvider` (retry off, `gcTime: Infinity`), `MemoryRouter` and `I18nextProvider`, and renders in `en` by default. Spec 02 extends it with the theme and order-ticket providers.
- jsdom has no `window.matchMedia`. `useMediaQuery` returns `false` without it; theme tests that depend on `prefers-color-scheme` must stub `matchMedia`.
- `setup.ts` clears `localStorage` after each test and resets the language to `en` before each.
- Fixtures: `DYCA` (positive return), `CAPX` (negative), `MIRG` (`last_price: 0`), `ARS` (`MONEDA`); portfolio with cash `1_000_000`, one gaining and one losing holding; FILLED / PENDING LIMIT / REJECTED orders.

## 3. Hand-off for spec 02

Start from an updated `main` on branch `spec/02-app-shell-theme-i18n`.

- **Load the `react-best-practices` skill first** (AGENTS.md, "React best practices").
- **Visual reference:** the layout canvas in session 05 (live link and repo copy). Header with brand, two nav links, theme toggle, language select; fixed bottom nav below 768px; content max-width 1200px; active nav item tinted with `--color-accent-text`, not a solid fill.
- **Spec 02 already reflects session 05:** no `/search` route or `SearchPage` stub, two nav items, `/search` renders not-found.
- **Smoke test:** `src/App.test.tsx` checks the spec 01 placeholder. Spec 02 replaces `App` with the providers + router, so update or replace that test.
- **Boot script:** keep its theme and language rules identical to `ThemeProvider` and `resolveInitialLanguage`; test both against the same cases.
- **Workflow:** one branch, one PR with `gh`, summarize against the spec, then stop for review.
