# Spec 02 — App Shell, Theme & i18n

| | |
|---|---|
| **Status** | Ready |
| **Depends on** | [01 — Foundation](./01-foundation.md) |
| **Owns** | Providers, router, layout, theme, language switcher, shared UI kit, order-ticket context, page stubs |
| **Must not build** | Instruments, search or portfolio features; order form/API |

## 1. Goal

Create the application shell and the reusable UI layer so feature specs 03–06 only add their own feature code.

Deliver:

- Provider composition root
- Theme system with dark/light toggle
- Language switcher wired to i18n
- Responsive app layout with desktop and mobile navigation
- Lazy routes and temporary page stubs
- Shared design-system components
- Order-ticket context and modal host stub
- Updated test render helper

## 2. Files owned

Create or modify only:

```text
index.html
src/App.tsx
src/app/App.tsx
src/app/providers/AppProviders.tsx
src/app/providers/ErrorBoundary.tsx
src/app/router.tsx
src/app/layout/AppLayout.tsx
src/app/layout/Header.tsx
src/app/layout/MobileNav.tsx
src/app/layout/SkipLink.tsx
src/app/layout/Container.tsx
src/app/layout/ThemeToggle.tsx
src/app/layout/LanguageSwitcher.tsx
src/app/theme/ThemeProvider.tsx
src/app/theme/theme.ts

src/features/order/model/OrderTicketContext.tsx
src/features/order/index.ts
src/app/layout/OrderModalContainer.tsx

src/pages/instruments/InstrumentsPage.tsx
src/pages/portfolio/PortfolioPage.tsx
src/pages/search/SearchPage.tsx
src/pages/not-found/NotFoundPage.tsx

src/shared/ui/Button/Button.tsx
src/shared/ui/Button/Button.module.scss
src/shared/ui/Button/index.ts
src/shared/ui/IconButton/IconButton.tsx
src/shared/ui/IconButton/IconButton.module.scss
src/shared/ui/IconButton/index.ts
src/shared/ui/Input/Input.tsx
src/shared/ui/Input/Input.module.scss
src/shared/ui/Input/index.ts
src/shared/ui/SegmentedControl/SegmentedControl.tsx
src/shared/ui/SegmentedControl/SegmentedControl.module.scss
src/shared/ui/SegmentedControl/index.ts
src/shared/ui/Badge/Badge.tsx
src/shared/ui/Badge/Badge.module.scss
src/shared/ui/Badge/index.ts
src/shared/ui/Card/Card.tsx
src/shared/ui/Card/Card.module.scss
src/shared/ui/Card/index.ts
src/shared/ui/Modal/Modal.tsx
src/shared/ui/Modal/Modal.module.scss
src/shared/ui/Modal/index.ts
src/shared/ui/Skeleton/Skeleton.tsx
src/shared/ui/Skeleton/Skeleton.module.scss
src/shared/ui/Skeleton/index.ts
src/shared/ui/Spinner/Spinner.tsx
src/shared/ui/Spinner/Spinner.module.scss
src/shared/ui/Spinner/index.ts
src/shared/ui/EmptyState/EmptyState.tsx
src/shared/ui/EmptyState/EmptyState.module.scss
src/shared/ui/EmptyState/index.ts
src/shared/ui/ErrorState/ErrorState.tsx
src/shared/ui/ErrorState/ErrorState.module.scss
src/shared/ui/ErrorState/index.ts
src/shared/ui/PageHeader/PageHeader.tsx
src/shared/ui/PageHeader/PageHeader.module.scss
src/shared/ui/PageHeader/index.ts
src/shared/ui/MoneyText/MoneyText.tsx
src/shared/ui/MoneyText/MoneyText.module.scss
src/shared/ui/MoneyText/index.ts
src/shared/ui/PercentText/PercentText.tsx
src/shared/ui/PercentText/PercentText.module.scss
src/shared/ui/PercentText/index.ts
src/shared/ui/VisuallyHidden/VisuallyHidden.tsx
src/shared/ui/VisuallyHidden/index.ts
src/shared/ui/RouteFallback/RouteFallback.tsx
src/shared/ui/RouteFallback/RouteFallback.module.scss
src/shared/ui/RouteFallback/index.ts

src/test/render.tsx
src/test/app-shell.test.tsx
src/test/theme.test.tsx
src/test/language-switcher.test.tsx
src/test/modal.test.tsx
```

Do not modify feature API files, i18n namespace files owned by specs 03–06, or `docs/api/**`.

## 3. Provider composition

`src/app/providers/AppProviders.tsx`:

```tsx
<ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <OrderTicketProvider>
        <RouterProvider router={router} />
      </OrderTicketProvider>
    </ThemeProvider>
  </QueryClientProvider>
</ErrorBoundary>
```

- `queryClient` comes from `shared/api/queryClient.ts`.
- `router` comes from `app/router.tsx`.
- `ErrorBoundary` is outermost.
- `src/App.tsx` renders `<AppProviders />`.

`ErrorBoundary`:

- class component catches render errors
- renders a functional `ErrorFallback`
- fallback uses `useTranslation`, shows `common.unexpectedErrorTitle`, `common.unexpectedErrorDescription`, and a retry button that resets the boundary
- logs the error to `console.error` in development only

## 4. Theme

### 4.1 Types and helpers

`src/app/theme/theme.ts`:

```ts
export type Theme = 'dark' | 'light'
export const THEME_STORAGE_KEY = 'ccs.theme'

export function isTheme(value: unknown): value is Theme
export function resolveInitialTheme(options?: {
  stored?: string | null
  prefersDark?: boolean
}): Theme
```

Order:

1. valid stored theme
2. `prefersDark` → `dark`
3. fallback `light`

### 4.2 Provider

`ThemeProvider` exposes:

```ts
{
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}
```

Requirements:

- On mount, read `document.documentElement.dataset.theme` if it is a valid theme; otherwise use `resolveInitialTheme`.
- Apply `document.documentElement.dataset.theme = theme`.
- If the user has an explicit stored theme, persist on change.
- If there is no stored theme, follow `prefers-color-scheme` changes via the `useMediaQuery` hook. A manual toggle makes the choice explicit and persisted.
- Never read `localStorage` during render in a way that breaks tests; use lazy initializer/effect.
- `useTheme` throws if used outside the provider.

### 4.3 No-flash boot script

Add to `index.html`, before the module script:

```html
<script>
  (function () {
    try {
      var theme = localStorage.getItem('ccs.theme')
      if (theme !== 'dark' && theme !== 'light') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      document.documentElement.dataset.theme = theme

      var lang = localStorage.getItem('ccs.lang')
      if (lang !== 'en' && lang !== 'es') {
        var languages = navigator.languages || [navigator.language || '']
        lang = 'es'
        for (var i = 0; i < languages.length; i++) {
          var value = String(languages[i]).toLowerCase()
          if (value.indexOf('es') === 0 || value.indexOf('en') === 0) {
            lang = value.slice(0, 2)
            break
          }
        }
      }
      document.documentElement.lang = lang
    } catch (error) {
      document.documentElement.dataset.theme = 'light'
      document.documentElement.lang = 'es'
    }
  })()
</script>
```

The React providers must use the same resolution rules to avoid a flash or mismatch.

### 4.4 Theme toggle

`ThemeToggle`:

- uses `IconButton`
- shows `Sun` in dark mode and `Moon` in light mode (or the inverse; pick one and test it)
- `aria-label` = `nav.switchToLight` or `nav.switchToDark`
- calls `toggleTheme`
- has a visible focus ring

## 5. Language switcher

`LanguageSwitcher`:

- uses `SegmentedControl` or two accessible buttons
- options: `EN`, `ES` (labels are not translated)
- current language from `i18n.language`
- on change calls `changeLanguage(locale)` from `shared/i18n/language.ts`
- `aria-label` = `nav.language`
- persists the explicit choice through `changeLanguage`
- updates `document.documentElement.lang`

## 6. Layout

### 6.1 `AppLayout`

```tsx
<div className={styles.shell}>
  <SkipLink />
  <Header />
  <main id="main" className={styles.main}>
    <Container>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </Container>
  </main>
  <MobileNav />
  <OrderModalContainer />
</div>
```

Requirements:

- `main` has bottom padding on mobile so the fixed nav does not cover content.
- content max width `1200px`, horizontal padding using tokens.
- no horizontal page scroll at 375 px.
- `SkipLink` is the first focusable element, visible on focus, targets `#main`.
- The shell background uses `--color-bg`.

### 6.2 Header

- brand link to `/instruments` using `common.appName`
- desktop nav: Instruments, Portfolio, Search (`NavLink`, active state)
- right side: `ThemeToggle`, `LanguageSwitcher`
- sticky at top with `backdrop-filter` if supported
- desktop nav hidden below `768px`

### 6.3 MobileNav

- fixed bottom navigation visible below `768px`
- three `NavLink` items with lucide icons and translated labels
- safe-area padding (`env(safe-area-inset-bottom)`)
- active state uses accent color and `aria-current="page"` (NavLink provides it)
- hidden on desktop

### 6.4 Container

Simple layout wrapper with `max-width` and responsive horizontal padding.

## 7. Router

`src/app/router.tsx` uses `createBrowserRouter` and `RouterProvider` from `react-router-dom`.

Routes:

```text
/             → <Navigate to="/instruments" replace />
/instruments  → InstrumentsPage (stub in this spec)
/portfolio    → PortfolioPage (stub in this spec)
/search       → SearchPage (stub in this spec)
*             → NotFoundPage
```

Layout route: `/` element `<AppLayout />` with the routes above as children.

- Lazy-load page components with `React.lazy` and `Suspense` (provided by `AppLayout`).
- Page modules use default exports.
- The stubs must compile and render a `PageHeader` with the translated section title and `common.comingSoon`.
- `NotFoundPage` is fully implemented in this spec: title, description, link back to instruments.

## 8. Order ticket context

`src/features/order/model/OrderTicketContext.tsx` is a stub contract consumed by specs 03–06.

```ts
import type { OrderSide } from '@/shared/api/types'

export interface OrderInstrument {
  id: number
  ticker: string
  name?: string
  last_price: number
}

export interface OpenOrderTicketInput {
  instrument: OrderInstrument
  side?: OrderSide
  quantity?: number
}

interface OrderTicketState {
  isOpen: boolean
  instrument: OrderInstrument | null
  presetSide: OrderSide
  presetQuantity?: number
}

interface OrderTicketContextValue {
  state: OrderTicketState
  open: (input: OpenOrderTicketInput) => void
  close: () => void
}
```

Requirements:

- implement with `useReducer`
- default `presetSide` is `BUY`
- `open` sets `isOpen: true`, the instrument, side and optional quantity
- `close` resets to the initial state
- `useOrderTicket` hook throws outside the provider
- export `OrderTicketProvider` and `useOrderTicket` from `features/order/index.ts`

`src/app/layout/OrderModalContainer.tsx` is an app-layer stub that returns `null` in this spec. It is mounted in `AppLayout` and is the composition point for the order feature:

- reads `state` and `close` from `useOrderTicket()`
- later (spec 06) fetches portfolio data through the portfolio feature’s public hook
- renders the order feature’s `OrderModal` with the instrument, preset values and portfolio data as props

Keeping this container in `app` prevents a feature-to-feature import (`order → portfolio`). Spec 06 replaces the stub body; the component name, path and mount point stay the same.

## 9. Shared UI kit

All components:

- use CSS Modules + Sass tokens
- accept `className`
- forward or accept React 19 refs where useful
- have accessible names
- support both themes
- respect reduced motion

### Button

```ts
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}
```

- default `type="button"`
- `isLoading` disables the button, sets `aria-busy`, and renders a spinner
- visible focus ring

### IconButton

- requires `label` for `aria-label`
- props: `label`, `icon`, `size`, `variant`
- used by theme toggle and modal close

### Input

```ts
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  fullWidth?: boolean
}
```

- generated `id` with `useId` when not supplied
- `aria-invalid` when error
- `aria-describedby` points to hint and/or error
- error text is visible and announced
- supports `inputMode`

### SegmentedControl

Generic, controlled:

```ts
interface SegmentedOption<T extends string> {
  value: T
  label: string
  disabled?: boolean
}

interface SegmentedControlProps<T extends string> {
  label: string
  value: T
  options: ReadonlyArray<SegmentedOption<T>>
  onChange: (value: T) => void
  name?: string
  disabled?: boolean
}
```

- use native radio inputs with visually hidden inputs and styled labels
- `<fieldset>` + `<legend>` or `role="radiogroup"` with `aria-label`
- keyboard behavior comes from the native radio group
- selected state is visible in both themes

### Badge

```ts
type BadgeVariant = 'neutral' | 'positive' | 'negative' | 'warning' | 'info'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  icon?: React.ReactNode
  className?: string
}
```

### Card

- simple surface container
- props: `children`, `className`, optional `as`
- uses `--color-surface`, border and radius tokens

### Modal

Accessible wrapper around `@radix-ui/react-dialog`.

```ts
interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
```

Requirements:

- portal to `document.body`
- overlay with `--color-overlay`
- focus trap, ESC, scroll lock from Radix
- visible close button using `IconButton` and `common.close`
- `Dialog.Title` is required
- if `description` is absent, avoid an orphan `aria-describedby`
- mobile: bottom sheet with rounded top corners and `max-height: 90dvh`, scrollable body
- desktop: centered dialog
- close button and overlay click call `onOpenChange(false)`

### Skeleton

- variants `text`, `rect`, `circle`
- `aria-hidden="true"`
- shimmer animation disabled under reduced motion

### Spinner

- `role="status"`
- visually hidden label, default `common.loading`
- sizes `sm`, `md`

### EmptyState

```ts
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}
```

### ErrorState

```ts
interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
}
```

Defaults use common error copy.

### PageHeader

```ts
interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}
```

### MoneyText

```ts
interface MoneyTextProps {
  value: number | null | undefined
  signed?: boolean
  tone?: 'default' | 'positive' | 'negative'
  className?: string
}
```

- uses `useFormat().currency`
- invalid value renders `common.notAvailable`
- tone classes use positive/negative tokens

### PercentText

```ts
interface PercentTextProps {
  value: number | null | undefined
  signed?: boolean // default true
  tone?: 'auto' | 'positive' | 'negative' | 'neutral'
  className?: string
}
```

- uses `useFormat().percent`
- `auto` tone: positive/negative/neutral based on value
- invalid value renders `common.notAvailable`

### VisuallyHidden

Standard visually-hidden span wrapper.

### RouteFallback

Full-width centered spinner with `common.loading`, used by Suspense.

## 10. Tests

### `app-shell.test.tsx`

- `/` redirects to `/instruments`
- `/instruments`, `/portfolio`, `/search` render their stub headers
- unknown route renders not-found copy and a link to instruments
- nav marks the active route
- skip link targets `#main`

### `theme.test.tsx`

- boot/default theme applies `data-theme`
- toggle changes theme, updates `data-theme`, and persists `ccs.theme`
- stored theme wins over system preference
- no stored theme and no dark preference resolves to `light`
- toggle has an accessible label in EN and ES

### `language-switcher.test.tsx`

- switches visible copy from EN to ES
- persists `ccs.lang`
- updates `document.documentElement.lang`
- switches back to EN
- tab labels remain `EN`/`ES`

### `modal.test.tsx`

- opens and renders title/description
- close button closes
- ESC closes
- focus is trapped inside while open
- mobile/desktop classes are not asserted; behavior only

Update `src/test/render.tsx` to wrap with:

- `QueryClientProvider` (test client, retry disabled)
- `ThemeProvider`
- `OrderTicketProvider`
- `MemoryRouter` or router provider as appropriate

## 11. Acceptance criteria

- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass.
- No hardcoded UI strings in components; all copy uses `t()`.
- Theme and language choices persist across reloads.
- `document.documentElement.dataset.theme` and `lang` are set before render via the boot script.
- The app is usable with keyboard only.
- Layout has no horizontal scroll at 375 px.
- Both themes render the UI kit without contrast issues.
- The order modal container is mounted in the layout but renders nothing until spec 06.
- Page stubs are replaced only by their owning feature spec.

## 12. Out of scope

- Instruments/search/portfolio data fetching and UI
- Order form, mutation, validation, result
- Filling feature i18n namespaces
- Full README and final QA

## 13. Agent notes

- Do not modify `specs/03`–`06` files.
- Keep the order ticket context API exactly as specified; spec 06 depends on it.
- Use lucide icons consistently; do not introduce another icon library.
- The boot script and the React providers must resolve theme/language identically.
- Prefer semantic HTML and native controls over ARIA-heavy custom widgets.
- Run `npm run format` after creating files.
