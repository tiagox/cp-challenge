# Spec 01 — Foundation

| | |
|---|---|
| **Status** | Ready |
| **Depends on** | [00 — API contract](./00-api-contract.md) |
| **Owns** | Final dependencies, tooling, Sass tokens, i18n infrastructure, entities, shared lib, test infrastructure, app entry placeholder |
| **Must not build** | App shell, nav, routes, pages, feature UI, order form |

## 1. Goal

Complete the project foundation so feature specs do not need to touch shared configuration again.

Deliver:

- Final `package.json`, scripts and dependencies
- Strict TypeScript, path aliases, ESLint, Prettier
- Sass tokens, mixins, reset and global styles
- Typed i18n infrastructure with EN/ES resources and namespace stubs
- Domain entities and pure calculations
- Shared formatting, math and hooks
- Test infrastructure: Vitest + RTL + MSW + fixtures
- A minimal app entry that initializes i18n

## 2. Files owned

Create or modify only:

```text
package.json
package-lock.json
tsconfig.json
tsconfig.app.json
tsconfig.node.json
vite.config.ts
vitest.config.ts
eslint.config.js
.prettierrc.json
.prettierignore
.editorconfig
index.html
README.md

src/main.tsx
src/App.tsx
src/vite-env.d.ts

src/app/styles/_tokens.scss
src/app/styles/_mixins.scss
src/app/styles/_reset.scss
src/app/styles/globals.scss

src/shared/api/queryKeys.ts

src/shared/i18n/index.ts
src/shared/i18n/types.ts
src/shared/i18n/language.ts
src/shared/i18n/useFormat.ts
src/shared/i18n/i18next.d.ts
src/shared/i18n/locales.parity.test.ts
src/shared/i18n/language.test.ts
src/shared/i18n/locales/en/common.ts
src/shared/i18n/locales/en/nav.ts
src/shared/i18n/locales/en/errors.ts
src/shared/i18n/locales/en/instruments.ts
src/shared/i18n/locales/en/portfolio.ts
src/shared/i18n/locales/en/search.ts
src/shared/i18n/locales/en/orders.ts
src/shared/i18n/locales/en/validation.ts
src/shared/i18n/locales/en/index.ts
src/shared/i18n/locales/es/common.ts
src/shared/i18n/locales/es/nav.ts
src/shared/i18n/locales/es/errors.ts
src/shared/i18n/locales/es/instruments.ts
src/shared/i18n/locales/es/portfolio.ts
src/shared/i18n/locales/es/search.ts
src/shared/i18n/locales/es/orders.ts
src/shared/i18n/locales/es/validation.ts
src/shared/i18n/locales/es/index.ts

src/shared/lib/format.ts
src/shared/lib/math.ts
src/shared/lib/cx.ts
src/shared/lib/hooks/useDebouncedValue.ts
src/shared/lib/hooks/useMediaQuery.ts
src/shared/lib/format.test.ts
src/shared/lib/math.test.ts

src/entities/instrument/model/types.ts
src/entities/instrument/model/metrics.ts
src/entities/instrument/model/metrics.test.ts
src/entities/position/model/types.ts
src/entities/position/model/metrics.ts
src/entities/position/model/metrics.test.ts

src/test/setup.ts
src/test/server.ts
src/test/render.tsx
src/test/msw/handlers.ts
src/test/fixtures/instruments.ts
src/test/fixtures/portfolio.ts
src/test/fixtures/orders.ts
```

Do not modify `docs/api/**`, `src/shared/api/config.ts`, `src/shared/api/http.ts`, `src/shared/api/errors.ts`, `src/shared/api/queryClient.ts`, `src/shared/api/types.ts` or generated types from spec 00. You may add `src/shared/api/queryKeys.ts`.

## 3. Final dependencies

Install runtime dependencies:

```bash
npm install \
  @tanstack/react-query@5.107.1 \
  react-router-dom@7.18.5 \
  i18next@27.1.1 \
  react-i18next@18.0.1 \
  @radix-ui/react-dialog@1.3.1 \
  lucide-react@1.71.0 \
  sass@1.108.1
```

Install dev dependencies:

```bash
npm install -D \
  @testing-library/react@16.3.3 \
  @testing-library/dom@10.4.2 \
  @testing-library/user-event@14.6.9 \
  @testing-library/jest-dom@7.0.1 \
  msw@3.0.4 \
  @vitest/coverage-v8@5.1.0 \
  eslint@10.14.0 \
  @eslint/js@10.0.1 \
  globals@17.14.0 \
  typescript-eslint@8.72.2 \
  eslint-plugin-react-hooks@7.1.1 \
  eslint-plugin-react-refresh@0.5.7 \
  eslint-plugin-jsx-a11y@6.10.2 \
  eslint-config-prettier@10.1.8 \
  prettier@3.9.10
```

Keep `typescript@5.9.3` and `openapi-typescript@7.13.0` from spec 00.

Add `"engines": { "node": ">=22" }`.

## 4. Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit -p tsconfig.app.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "api:types": "openapi-typescript docs/api/openapi.yaml -o src/shared/api/generated/schema.ts",
    "api:types:check": "npm run api:types && git diff --exit-code -- src/shared/api/generated/schema.ts"
  }
}
```

Ensure `npm run typecheck` works with the chosen tsconfig layout. If project references make `--noEmit` awkward, use a single `tsconfig.app.json` with `noEmit: true` for typechecking and keep `tsc -b` for builds.

## 5. TypeScript

Requirements:

- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noFallthroughCasesInSwitch: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `verbatimModuleSyntax: true`
- `isolatedModules: true`
- `moduleResolution: "bundler"`
- `jsx: "react-jsx"`
- Path alias `@/*` → `src/*` in both `tsconfig` and Vite `resolve.alias`.
- `types: ["vite/client"]` in the app config.
- Generated API types must compile without errors.

## 6. Lint and format

`eslint.config.js` flat config:

- ignore `dist`, `coverage`, `src/shared/api/generated`
- `@eslint/js` recommended
- `typescript-eslint` recommended
- `eslint-plugin-react-hooks` recommended
- `eslint-plugin-react-refresh` Vite config
- `eslint-plugin-jsx-a11y` recommended
- `eslint-config-prettier` last

Prettier:

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

Add `.prettierignore` for `dist`, `coverage`, `package-lock.json`, `src/shared/api/generated`.

Add a basic `.editorconfig` (UTF-8, LF, 2-space indent).

## 7. Sass foundation

Create `src/app/styles/`.

### `_tokens.scss`

Define CSS custom properties on `:root`, `:root[data-theme='dark']` and `:root[data-theme='light']`.

Required token groups:

- `--color-bg`, `--color-surface`, `--color-surface-2`, `--color-border`
- `--color-text`, `--color-text-muted`
- `--color-accent`, `--color-accent-hover`, `--color-on-accent`
- `--color-positive`, `--color-negative`, `--color-warning`, `--color-info`
- `--color-overlay`
- `--space-1` … `--space-8` (4, 8, 12, 16, 24, 32, 48, 64 px)
- `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-pill`
- `--font-sans` (system stack), `--font-mono`
- `--text-xs`, `--text-sm`, `--text-md`, `--text-lg`, `--text-xl`, `--text-2xl`
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- `--z-header`, `--z-bottom-nav`, `--z-modal`

Suggested palette:

| Token | Dark | Light |
|---|---|---|
| bg | `#0B0E11` | `#F7F8FA` |
| surface | `#13171C` | `#FFFFFF` |
| surface-2 | `#1A1F26` | `#F0F2F5` |
| border | `#252B33` | `#E2E6EB` |
| text | `#F3F5F7` | `#0F1419` |
| text-muted | `#8B95A5` | `#5C6675` |
| accent | `#3B82F6` | `#1F5EFF` |
| positive | `#16C784` | `#0E9F6E` |
| negative | `#EA3943` | `#D92D20` |
| warning | `#F0B90B` | `#B7791F` |

Set `color-scheme: dark` / `light` per theme.

Sass-only variables:

```scss
$bp-sm: 480px;
$bp-md: 768px;
$bp-lg: 1024px;
$bp-xl: 1280px;
```

### `_mixins.scss`

Provide:

- `respond-to($bp)` media query mixin
- `focus-ring` using `:focus-visible`
- `visually-hidden`
- `truncate`
- `card-surface`

### `_reset.scss`

Modern reset: box-sizing, margin reset, media defaults, button/input font inheritance, `min-height: 100%`, `text-rendering`.

### `globals.scss`

Import tokens, reset and global element styles:

- body background/text using tokens
- `min-height: 100dvh`
- selection color
- focus-visible outline
- `prefers-reduced-motion: reduce` disables animations/transitions
- no horizontal page scroll

## 8. i18n infrastructure

### 8.1 Types and language detection

`src/shared/i18n/types.ts`:

```ts
export type AppLocale = 'en' | 'es'
export const SUPPORTED_LOCALES = ['en', 'es'] as const
export const LANGUAGE_STORAGE_KEY = 'ccs.lang'
```

`src/shared/i18n/language.ts`:

```ts
export function isAppLocale(value: unknown): value is AppLocale
export function getIntlLocale(locale: AppLocale): 'en-US' | 'es-AR'
export function resolveInitialLanguage(options?: {
  stored?: string | null
  navigatorLanguages?: readonly string[]
}): AppLocale
export function persistLanguage(locale: AppLocale): void
export async function changeLanguage(locale: AppLocale): Promise<void>
```

Detection order:

1. `stored` if it is `en` or `es`
2. first `navigatorLanguages` entry starting with `es` or `en` → that locale
3. fallback `es`

`changeLanguage` must:

- call `i18n.changeLanguage(locale)`
- persist `ccs.lang`
- set `document.documentElement.lang = locale`

Do not persist a detected language automatically.

### 8.2 Resources

One namespace file per feature so each feature spec owns its own copy.

`en/index.ts`:

```ts
import { common } from './common'
import { nav } from './nav'
import { errors } from './errors'
import { instruments } from './instruments'
import { portfolio } from './portfolio'
import { search } from './search'
import { orders } from './orders'
import { validation } from './validation'

export const en = {
  common,
  nav,
  errors,
  instruments,
  portfolio,
  search,
  orders,
  validation,
}
```

`es/index.ts` mirrors it and ends with:

```ts
export const es = { ... } satisfies typeof en
```

Feature namespace files (`instruments`, `portfolio`, `search`, `orders`, `validation`) are **empty objects with a comment** in this spec. Feature specs fill them.

### 8.3 Required common copy

`en/common.ts` and `es/common.ts`:

| Key | EN | ES |
|---|---|---|
| `appName` | `Cocos Invest` | `Cocos Invest` |
| `loading` | `Loading...` | `Cargando...` |
| `retry` | `Retry` | `Reintentar` |
| `close` | `Close` | `Cerrar` |
| `cancel` | `Cancel` | `Cancelar` |
| `back` | `Back` | `Volver` |
| `notAvailable` | `—` | `—` |
| `comingSoon` | `Coming soon` | `Próximamente` |
| `unexpectedErrorTitle` | `Something went wrong` | `Algo salió mal` |
| `unexpectedErrorDescription` | `Please try again.` | `Intentá de nuevo.` |
| `notFoundTitle` | `Page not found` | `Página no encontrada` |
| `notFoundDescription` | `The page you are looking for does not exist.` | `La página que buscás no existe.` |
| `goToInstruments` | `Go to instruments` | `Ir a instrumentos` |
| `refresh` | `Refresh` | `Actualizar` |

### 8.4 Required nav copy

`en/nav.ts` and `es/nav.ts`:

| Key | EN | ES |
|---|---|---|
| `instruments` | `Instruments` | `Instrumentos` |
| `portfolio` | `Portfolio` | `Portafolio` |
| `search` | `Search` | `Buscar` |
| `mainNavigation` | `Main navigation` | `Navegación principal` |
| `skipToContent` | `Skip to content` | `Saltar al contenido` |
| `toggleTheme` | `Toggle theme` | `Cambiar tema` |
| `switchToLight` | `Switch to light theme` | `Cambiar a tema claro` |
| `switchToDark` | `Switch to dark theme` | `Cambiar a tema oscuro` |
| `language` | `Language` | `Idioma` |

### 8.5 Required error copy

`en/errors.ts` and `es/errors.ts`:

| Key | EN | ES |
|---|---|---|
| `network` | `Network error. Check your connection and try again.` | `Error de red. Revisá tu conexión e intentá de nuevo.` |
| `timeout` | `The request took too long. Please try again.` | `La solicitud tardó demasiado. Intentá de nuevo.` |
| `unexpected` | `Something went wrong. Please try again.` | `Algo salió mal. Intentá de nuevo.` |
| `server` | `The server returned an error.` | `El servidor devolvió un error.` |
| `notFound` | `Not found.` | `No encontrado.` |

### 8.6 Init

`src/shared/i18n/index.ts`:

- import `i18next` and `initReactI18next`
- import `en` and `es`
- initialize synchronously with bundled resources:
  - `resources: { en: { translation: en }, es: { translation: es } }`
  - `lng: resolveInitialLanguage()`
  - `fallbackLng: 'es'`
  - `supportedLngs: ['en', 'es']`
  - `interpolation: { escapeValue: false }`
  - `returnNull: false`
  - the synchronous option supported by the installed i18next version (`initAsync: false` or `initImmediate: false`)
- set `document.documentElement.lang` after init

### 8.7 Type augmentation

`src/shared/i18n/i18next.d.ts`:

```ts
import 'i18next'
import type { en } from './locales/en'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof en
    }
  }
}
```

### 8.8 Formatting hook

`src/shared/i18n/useFormat.ts`:

```ts
export function useFormat(): {
  locale: AppLocale
  currency: (value: number | null | undefined, options?: { signed?: boolean }) => string | null
  percent: (value: number | null | undefined, options?: { signed?: boolean }) => string | null
  quantity: (value: number | null | undefined) => string | null
}
```

Implementation binds `shared/lib/format` functions to `i18n.language`.

### 8.9 Tests

- `language.test.ts`: stored choice wins; `es-AR` browser → `es`; `en-US` browser → `en`; `['fr-FR', 'en-US']` → `en`; French-only browser → `es`; missing data → `es`.
- `locales.parity.test.ts`: flatten EN and ES keys, assert identical sorted key sets.
- No empty translation values for non-empty namespaces.

## 9. Domain entities

Use DTO aliases from `src/shared/api/types.ts`.

### `entities/instrument/model/types.ts`

```ts
export type Instrument = import('@/shared/api/types').Instrument
export type InstrumentType = Instrument['type']
```

### `entities/instrument/model/metrics.ts`

```ts
export function returnPercent(lastPrice: number, closePrice: number): number | null
```

`(lastPrice - closePrice) / closePrice * 100`. Return `null` for non-finite values or `closePrice <= 0`.

### `entities/position/model/types.ts`

```ts
export type Holding = import('@/shared/api/types').Holding
export type Portfolio = import('@/shared/api/types').Portfolio
```

### `entities/position/model/metrics.ts`

```ts
export interface PortfolioMetrics {
  marketValue: number
  costBasis: number
  profitLoss: number
  returnPercent: number | null
}

export function marketValue(quantity: number, lastPrice: number): number
export function profitLoss(quantity: number, lastPrice: number, avgCostPrice: number): number
export function returnOnCost(lastPrice: number, avgCostPrice: number): number | null
export function aggregatePortfolio(holdings: Holding[]): PortfolioMetrics
```

Rules:

- `marketValue = quantity * lastPrice`
- `profitLoss = (lastPrice - avgCostPrice) * quantity`
- `returnOnCost = (lastPrice - avgCostPrice) / avgCostPrice * 100`, `null` when `avgCostPrice <= 0`
- `aggregatePortfolio`: sum cost basis and market value; profit loss is the difference; return is `profitLoss / costBasis * 100`, `null` when cost basis is `0`
- Guard all non-finite inputs; return `0` for additive values, `null` for ratios

### Tests

Cover positive, negative, zero and non-finite values; zero denominators; empty holdings.

## 10. Shared lib

### `format.ts`

```ts
import type { AppLocale } from '@/shared/i18n/types'

export function formatCurrency(
  value: number | null | undefined,
  locale: AppLocale,
  options?: { signed?: boolean },
): string | null

export function formatPercent(
  value: number | null | undefined,
  locale: AppLocale,
  options?: { signed?: boolean },
): string | null

export function formatQuantity(
  value: number | null | undefined,
  locale: AppLocale,
): string | null
```

- `en` → `en-US`, `es` → `es-AR`
- currency is always `ARS`, 2 fraction digits
- signed currency/percent use `signDisplay: 'always'`
- invalid input → `null`
- tests normalize non-breaking spaces before asserting

### `math.ts`

```ts
export function isFiniteNumber(value: unknown): value is number
export function round2(value: number): number
export function floorShares(amount: number, price: number): number
```

`floorShares` returns `0` when price is `<= 0` or inputs are invalid.

### `cx.ts`

Small class-name joiner accepting strings, `false`, `null`, `undefined`.

### `hooks/useDebouncedValue.ts`

Generic hook with configurable delay, default `300` ms.

### `hooks/useMediaQuery.ts`

SSR-safe `matchMedia` subscription; used by the theme provider in spec 02.

## 11. Query keys

`src/shared/api/queryKeys.ts`:

```ts
export const queryKeys = {
  instruments: ['instruments'] as const,
  portfolio: ['portfolio'] as const,
  search: (query: string) => ['search', query] as const,
}
```

Feature specs must use this registry.

## 12. Test infrastructure

### `src/test/setup.ts`

- import `@testing-library/jest-dom/vitest`
- `afterEach(cleanup)`
- start/stop/reset the MSW server
- reset i18n to `en` before each test
- clear `localStorage` between tests

### `src/test/server.ts`

`setupServer(...handlers)` from MSW.

### `src/test/msw/handlers.ts`

Handlers for:

- `GET /instruments`
- `GET /portfolio`
- `GET /search?query=`
- `POST /orders`

Requirements:

- Match against `API_BASE_URL`.
- Return fixtures.
- Search filters instruments case-insensitively by ticker.
- POST returns a FILLED order by default; tests override with `server.use`.
- If `X-Enable-Bugs` is missing or not `off`, return `400 { error: ... }`.
- If `X-Candidate-Id` is missing, return `400 { error: 'Missing X-Candidate-Id header' }`.
- `onUnhandledRequest: 'error'` in the server config.

### Fixtures

`instruments.ts`:

- `DYCA` with positive return
- `CAPX` with negative return
- `MIRG` with `last_price: 0`
- `ARS` as `MONEDA`

`portfolio.ts`:

- cash `1_000_000`
- one positive position
- one negative position

`orders.ts`:

- FILLED order
- PENDING LIMIT order
- REJECTED order shape

Export typed fixtures using `satisfies` against API types.

### `src/test/render.tsx`

```tsx
export function createTestQueryClient(): QueryClient
export function renderWithProviders(
  ui: ReactNode,
  options?: { route?: string; lang?: AppLocale },
): RenderResult
```

Wrap with:

- `QueryClientProvider` using a test client with `retry: false`
- `MemoryRouter` at `options.route ?? '/'`
- `I18nextProvider` with the app i18n instance, switched to `options.lang ?? 'en'` before rendering

The app defaults to `es`, but tests default to `en` so assertions read naturally. Feature specs pass `{ lang: 'es' }` for their Spanish coverage.

Spec 02 extends this helper with theme and order-ticket providers.

## 13. App entry placeholder

- `src/main.tsx` imports `./shared/i18n`, `./app/styles/globals.scss`, and renders `<App />`.
- `src/App.tsx` renders a minimal translated placeholder:

```tsx
<main>
  <h1>{t('common.appName')}</h1>
  <p>{t('common.comingSoon')}</p>
</main>
```

Spec 02 replaces this with the real shell. Do not add routing or providers here.

## 14. README skeleton

Create a short `README.md` with:

- project name
- stack summary
- scripts table
- env vars
- link to `specs/`
- note that full documentation lands in spec 07

## 15. Tests required

- `language.test.ts`
- `locales.parity.test.ts`
- `format.test.ts` for EN and ES
- `math.test.ts`
- `instrument/metrics.test.ts`
- `position/metrics.test.ts`
- A smoke test that renders the placeholder and finds the app name

## 16. Acceptance criteria

- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run test` passes.
- `npm run build` passes.
- `npm run api:types:check` passes.
- i18n initializes without missing-key warnings.
- EN/ES key parity test passes.
- Formatting tests assert both locales.
- No hardcoded strings in `src/App.tsx`.
- Path alias `@/` resolves in Vite and Vitest.
- Generated API types are excluded from lint/format.

## 17. Out of scope

- Providers, router, layout, nav, theme toggle, language switcher
- Shared UI components
- Page components and feature APIs
- Order ticket context
- Feature copy beyond common/nav/errors
- Full README

## 18. Agent notes

- Do not modify spec 00’s API client files.
- Do not add feature translations; leave namespace files empty for specs 03–06.
- Keep `src/App.tsx` minimal; spec 02 owns the shell.
- If `initAsync` is not recognized, use `initImmediate: false`; the requirement is synchronous bundled init.
- Verify `Intl` output in Node; non-breaking spaces are expected.
- Run `npm run format` after creating files.
