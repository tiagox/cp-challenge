---
session: 02
date: 2026-11-10
agent: claude-code
mode: design
title: Theme palette, font and fallback
status: accepted
related_specs:
  - specs/README.md
  - specs/01-foundation.md
  - specs/02-app-shell-theme-i18n.md
---

# Session 02 — Theme palette

## 1. Context

The user asked for the app's theme to use the colour palette of https://cocos.capital/. The site blocks curl and WebFetch behind Cloudflare, so the palette was read from the rendered page in Chrome: the site exposes a `--cocos-theme-*` set of CSS custom properties on `:root`.

The options were reviewed on a design canvas with the user:

- Live canvas (private to the owner): https://claude.ai/artifact/1GJLcf2JMgSxLzySgaSk8W
- Copy kept in this repo: [`02-theme-palette/canvas/`](./02-theme-palette/canvas/). The `.dc.html` files are the canvas's artboards; they need the Design canvas runtime (`support.js`) to render, so read them as source or open the live link. Mockup data is real `/instruments` output from 2026-11-10.

## 2. Source palette (cocos.capital, light only)

| Cocos variable | Value |
|---|---|
| `brand-primary` | `#002C66` (hsl 214 100% 20%) |
| `brand-secondary` (action default) | `#0061E0` (hsl 214 100% 44%) |
| `brand-alt` | `#0EBE8C` (hsl 163 86% 40%); darker gradient end `#07785A` |
| `brand-dark` (default text) | `#00152E` (hsl 213 100% 9%) |
| `bg-primary` / `bg-secondary` / `bg-tertiary` | `#F2F7FD` / `#FFFFFF` / `#FAFAFA` |
| `border-primary` / `-secondary` / `-tertiary` | `#E5E9EF` / `#EDF2F7` / `#C3CCD7` |
| `border-primary-alt` | `#164583` |
| `text-title` | `#597291` |
| `text-alt-light` | `#8DA7C8` |
| `action-hover` / `action-pressed` | `#0571FF` / `#0052BD` |
| dark sections (computed) | `#001533` |
| focus glow (computed) | `#8AC0F6` |
| font | Plus Jakarta Sans |

The site has no dark mode and no red.

## 3. Decisions

1. **Palette source.** Light theme uses the Cocos tokens as-is. Dark theme is derived from Cocos's navy sections (`#001533`, `#164583`, `#8DA7C8`). Exact token values live in spec 01 §7.
2. **Fallback theme is `light`.** Order: stored `cp.theme` → `prefers-color-scheme` → `light`. Boot script and `ThemeProvider` match; the boot script's error path also sets `light`.
3. **New `--color-accent-text` token.** Brand blue as text on the dark background is 3.3:1 (fails AA). `--color-accent` is a fill only; links, accent-coloured text and the focus ring use `--color-accent-text` (`#0062DE` light, `#8AC0F6` dark).
4. **Hover goes darker.** `--color-accent-hover` is `#0052BD` (Cocos's pressed colour, 7.1:1 with white text) instead of Cocos's lighter `#0571FF` (4.4:1).
5. **Gains, losses and warnings.** Positive `#07785A` / `#0CB077`; negative `#C8281C` / `#FF6B6B`; warning `#8A5A00` / `#F0B90B`. All pass 4.5:1 as text on their theme's background.
6. **Font: Plus Jakarta Sans**, self-hosted through `@fontsource-variable/plus-jakarta-sans@5.3.0` (OFL-1.1), imported in `src/main.tsx`. `--font-sans` is `'Plus Jakarta Sans Variable'` followed by the system stack.
7. **Palette and font only.** No Cocos logo, wordmark, name or imagery; the app must not pass itself off as Cocos's product.

Also confirmed on the canvas: the order form is a modal over the screen it was opened from, as the brief requires and spec 06 already specifies.

## 4. Rejected alternatives

| Alternative | Why rejected |
|---|---|
| Keep spec 01's generic palette | User asked for the Cocos palette |
| Brand blue as link text in dark | 3.3:1, fails WCAG AA |
| Cocos's lighter hover `#0571FF` | White text drops to 4.4:1 |
| Cocos's bright green `#0EBE8C` for gains on light | 2.8:1 as text |
| `#8AC0F6` focus ring in light | 1.8:1 against the light background |
| System font stack | User chose Cocos's font |
| Google Fonts `<link>` | Runtime third-party request; not available offline in tests |
| `dark` fallback | Cocos's brand is light |

## 5. Dependency note

`AGENTS.md` discourages convenience dependencies. The font package is a deliberate, user-approved addition: it is the only way to ship the brand font without a third-party runtime request. It adds no JavaScript to the bundle beyond the CSS `@font-face` import.
