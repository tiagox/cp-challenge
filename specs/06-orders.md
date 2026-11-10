# Spec 06 — Orders

| | |
|---|---|
| **Status** | Ready |
| **Depends on** | [02 — App shell, theme & i18n](./02-app-shell-theme-i18n.md), [05 — Portfolio](./05-portfolio.md) (public `usePortfolio` hook) |
| **Owns** | Order feature, order modal, app-layer `OrderModalContainer`, `orders` and `validation` i18n namespaces |
| **Can run in parallel with** | 03, 04 — after 05’s query hook lands |

## 1. Goal

Implement the order modal:

- opened by clicking an instrument from instruments, search or portfolio
- BUY/SELL side and MARKET/LIMIT type
- quantity and amount fields linked through the last price
- limit price required only for LIMIT
- integer shares only
- client-side validation matching server rules
- POST `/orders`
- show returned `id` and `status`
- invalidate the portfolio after completion
- fully localized EN/ES
- accessible and responsive

## 2. Files owned

Create or replace only:

```text
src/features/order/api.ts
src/features/order/mutations.ts
src/features/order/index.ts
src/features/order/model/linkedFields.ts
src/features/order/model/validation.ts
src/features/order/model/errorMapping.ts
src/features/order/ui/OrderModal.tsx
src/features/order/ui/OrderModal.module.scss
src/features/order/ui/OrderForm.tsx
src/features/order/ui/OrderForm.module.scss
src/features/order/ui/OrderResult.tsx
src/features/order/ui/OrderResult.module.scss
src/features/order/ui/OrderStatusBadge.tsx
src/features/order/ui/OrderStatusBadge.module.scss
src/features/order/ui/order.module.scss

src/app/layout/OrderModalContainer.tsx

src/shared/i18n/locales/en/orders.ts
src/shared/i18n/locales/en/validation.ts
src/shared/i18n/locales/es/orders.ts
src/shared/i18n/locales/es/validation.ts

src/features/order/model/linkedFields.test.ts
src/features/order/model/validation.test.ts
src/features/order/model/errorMapping.test.ts
src/features/order/orderModal.test.tsx
src/app/layout/OrderModalContainer.test.tsx
```

Do not change the order-ticket context API created in spec 02. Do not modify feature pages, router, shared UI or API client. The only app-layer file you may replace is the `OrderModalContainer` stub created by spec 02.

## 3. Context contract

Use the context from `src/features/order/model/OrderTicketContext.tsx`:

```ts
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
```

`src/app/layout/OrderModalContainer.tsx` (app layer) reads `state` and `close` from `useOrderTicket()`.

It also calls `usePortfolio()` from `@/features/portfolio` and owns the loading/error handling for that query. It renders `OrderModal` only when `state.isOpen && state.instrument`, passing:

```ts
<OrderModal
  instrument={state.instrument}
  initialSide={state.presetSide}
  initialQuantity={state.presetQuantity}
  cash={portfolio.data?.cash}
  holdings={portfolio.data?.holdings}
  portfolioStatus={portfolio.status}
  onRetryPortfolio={portfolio.refetch}
  onClose={close}
/>
```

Rules:

- The order feature never imports the portfolio feature.
- `OrderModal` receives portfolio data through props and remains a pure feature component.
- The container keeps the existing `OrderModalContainer` export; spec 02 already mounts it in `AppLayout`.

## 4. Data layer

### `api.ts`

```ts
import { http } from '@/shared/api/http'
import type { CreateOrderRequest, Order } from '@/shared/api/types'

export async function createOrder(payload: CreateOrderRequest): Promise<Order> {
  return http.post<Order>('/orders', payload)
}
```

### `mutations.ts`

```ts
export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateOrderRequest) => createOrder(payload),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.portfolio })
    },
  })
}
```

Requirements:

- `retry: false` is mandatory.
- Invalidate `queryKeys.portfolio` after any completed mutation that reaches `onSuccess`.
- Do not optimistically update the portfolio.

## 5. Linked quantity and amount

`model/linkedFields.ts`:

```ts
export function amountFromQuantity(
  quantity: number,
  lastPrice: number,
): number | null

export function quantityFromAmount(
  amount: number,
  lastPrice: number,
): number | null
```

Rules:

- `amountFromQuantity = round2(quantity * lastPrice)`
- `quantityFromAmount = floorShares(amount, lastPrice)`
- return `null` for invalid/non-finite input or `lastPrice <= 0`
- no fractional shares ever
- use `round2` and `floorShares` from `shared/lib/math`

Form behavior:

- editing **quantity** updates amount: `amount = amountFromQuantity(quantity, last_price)`
- editing **amount** updates quantity: `quantity = quantityFromAmount(amount, last_price)`
- the last edited field is the source of truth; do not re-overwrite it
- limit price does **not** participate in this link
- if `last_price <= 0`, show `orders.errors.lastPriceUnavailable` and disable the form’s submit

## 6. Validation

`model/validation.ts`:

```ts
export type OrderField = 'quantity' | 'amount' | 'price' | 'form'

export type OrderValidationCode =
  | 'QUANTITY_REQUIRED'
  | 'QUANTITY_INTEGER'
  | 'QUANTITY_MIN'
  | 'PRICE_REQUIRED'
  | 'PRICE_POSITIVE'
  | 'INSUFFICIENT_CASH'
  | 'INSUFFICIENT_SHARES'
  | 'LAST_PRICE_UNAVAILABLE'
  | 'NO_HOLDING'

export interface OrderValidationInput {
  side: OrderSide
  type: OrderType
  quantity: number | null
  amount: number | null
  limitPrice: number | null
  lastPrice: number
  cash: number
  availableShares: number
}

export interface OrderValidationResult {
  valid: boolean
  errors: Partial<Record<OrderField, OrderValidationCode>>
  quantity: number
  effectivePrice: number
  estimatedTotal: number
}

export function validateOrder(input: OrderValidationInput): OrderValidationResult
```

Rules:

1. Quantity must be present, finite, integer and `>= 1`.
2. MARKET: `lastPrice > 0`, otherwise `LAST_PRICE_UNAVAILABLE` on `form`.
3. LIMIT: price is required and `> 0`.
4. `effectivePrice`:
   - MARKET → `lastPrice`
   - LIMIT → `limitPrice`
5. `estimatedTotal = quantity * effectivePrice`, rounded to 2 decimals for display/comparison.
6. BUY: `estimatedTotal <= cash` (allow a tiny floating-point tolerance).
7. SELL:
   - no holding (`availableShares <= 0`) → `NO_HOLDING`
   - `quantity > availableShares` → `INSUFFICIENT_SHARES`
8. `valid` only when `errors` is empty.
9. Return `quantity`, `effectivePrice` and `estimatedTotal` even when invalid, using safe `0` fallbacks.

`amount` is a helper, not a submitted value. If it produces `quantity = 0`, the quantity error is shown. Do not add a separate amount error code.

### Error mapping

`model/errorMapping.ts`:

```ts
export function orderErrorMessageKey(error: unknown): string
```

Map known server messages:

| Server message | Translation key |
|---|---|
| `Insufficient cash` | `validation.insufficientCash` |
| `Insufficient shares` | `validation.insufficientShares` |
| `quantity must be a positive integer` | `validation.quantityInteger` |
| `quantity must be a positive number` | `validation.quantityInteger` |
| `LIMIT orders require a numeric price` | `validation.priceRequired` |
| `Instrument not found` | `orders.errors.instrumentNotFound` |
| `Missing X-Candidate-Id header` | `orders.errors.session` |

By `ApiError.code`:

| Code | Key |
|---|---|
| `NETWORK` | `errors.network` |
| `TIMEOUT` | `errors.timeout` |
| `ABORTED` | `errors.unexpected` |
| HTTP `>= 500` | `errors.server` |
| anything else | `orders.errors.unknown` |

## 7. Modal behavior

`OrderModal` props:

```ts
interface OrderModalProps {
  instrument: OrderInstrument
  initialSide: OrderSide
  initialQuantity?: number
  cash: number | undefined
  holdings: Holding[] | undefined
  portfolioStatus: 'pending' | 'error' | 'success'
  onRetryPortfolio: () => void
  onClose: () => void
}
```

`Holding` is imported from `@/entities/position/model/types`.

### Data

- receive `cash`, `holdings`, `portfolioStatus` and `onRetryPortfolio` from `OrderModalContainer`; do not call `usePortfolio()` inside the order feature
- find the holding by `instrument.id`
- if `portfolioStatus === 'pending'`, show a spinner inside the modal
- if `portfolioStatus === 'error'`, show `ErrorState` with retry calling `onRetryPortfolio`
- the modal can still be closed while loading

### Initial state

- `side = initialSide`
- `type = 'MARKET'`
- `quantity = initialQuantity` (string) or empty
- `amount = initialQuantity ? amountFromQuantity(initialQuantity, last_price)` or empty
- `limitPrice = String(last_price)` (used when switching to LIMIT)
- `lastEdited = 'quantity'`
- `result = null`
- `submitted = false`

### Form

- `SegmentedControl` for side: BUY / SELL
- `SegmentedControl` for type: MARKET / LIMIT
- `Input` for quantity:
  - `type="number"`
  - `step="1"`
  - `min="1"`
  - `inputMode="numeric"`
  - label `orders.fields.quantity`
- `Input` for amount:
  - `type="number"`
  - `step="0.01"`
  - `min="0"`
  - `inputMode="decimal"`
  - label `orders.fields.amount`
  - hint `orders.hints.amount`
- `Input` for limit price, rendered only when `type === 'LIMIT'`:
  - `type="number"`
  - `step="0.01"`
  - `min="0"`
  - `inputMode="decimal"`
  - label `orders.fields.limitPrice`
  - hint `orders.hints.limit`
- availability line:
  - BUY: `orders.fields.availableCash` + `MoneyText`
  - SELL: `orders.fields.availableShares` + formatted quantity
- summary:
  - `orders.fields.estimatedTotal` + `MoneyText`
  - updates live
- footer:
  - Cancel → `onClose`
  - Submit → label `orders.actions.submitBuy` or `submitSell`
  - while pending: `orders.actions.submitting`, disabled, spinner
  - never allow double submit

### Submit

1. Parse quantity, amount and limit price from input strings.
2. Run `validateOrder`.
3. If invalid:
   - set `submitted = true`
   - show inline errors
   - focus the first invalid field
   - do not call the API
4. If valid, build the payload:

```ts
{
  instrument_id: instrument.id,
  side,
  type,
  quantity: validation.quantity,
  ...(type === 'LIMIT' ? { price: Number(limitPriceInput) } : {}),
}
```

5. Call `useCreateOrder().mutate(payload, { onSuccess, onError })`.
6. On success: store the returned order and render the result.
7. On error: store the mapped message key and render a rejected result.
8. The modal stays open after completion; the user can close it or start a new order.

### Result

`OrderResult`:

- container has `aria-live="polite"`
- success:
  - title `orders.result.title`
  - `orders.result.orderId` with `id`
  - status badge with translated label + raw code
  - message:
    - FILLED → `orders.result.filled`
    - PENDING → `orders.result.pending`
    - REJECTED → `orders.result.rejected`
  - show `orders.fields.estimatedTotal` if useful
- error:
  - title `orders.result.rejected`
  - localized reason from `orderErrorMessageKey`
  - no id
  - optionally show the raw server message in a muted `<details>` block
- actions:
  - Close → `onClose`
  - New order → reset form and result, keep modal open

### Accessibility

- Radix Dialog provides focus trap, ESC and scroll lock.
- Modal title is `orders.title.buy` / `orders.title.sell` with the ticker.
- Description is `orders.description`.
- Every input has a label and `aria-describedby` for hint/error.
- Inline errors use `aria-live="polite"` or `role="alert"`.
- Focus the first invalid field on invalid submit.
- Submit button has a clear accessible name.
- Amount and quantity inputs are reachable by keyboard.
- The result region is announced.

## 8. i18n namespaces

### `en/orders.ts`

```ts
export const orders = {
  title: {
    buy: 'Buy {{ticker}}',
    sell: 'Sell {{ticker}}',
  },
  description: 'Place a market or limit order.',
  side: {
    label: 'Side',
    BUY: 'Buy',
    SELL: 'Sell',
  },
  type: {
    label: 'Order type',
    MARKET: 'Market',
    LIMIT: 'Limit',
  },
  fields: {
    quantity: 'Quantity (shares)',
    amount: 'Amount (ARS)',
    limitPrice: 'Limit price',
    estimatedTotal: 'Estimated total',
    availableCash: 'Available cash',
    availableShares: 'Available shares',
  },
  hints: {
    amount: 'Whole shares are calculated using the last price.',
    limit: 'The estimated total uses the limit price.',
  },
  actions: {
    cancel: 'Cancel',
    submitBuy: 'Buy',
    submitSell: 'Sell',
    submitting: 'Submitting...',
    newOrder: 'New order',
    close: 'Close',
  },
  result: {
    title: 'Order result',
    filled: 'Order filled successfully.',
    pending: 'Order submitted. It is pending execution.',
    rejected: 'Order rejected.',
    orderId: 'Order #{{id}}',
  },
  status: {
    PENDING: 'Pending',
    FILLED: 'Filled',
    REJECTED: 'Rejected',
  },
  errors: {
    instrumentNotFound: 'This instrument is no longer available.',
    session: 'Your session is not available. Reload the page.',
    unknown: 'The order could not be completed.',
    lastPriceUnavailable: 'The last price is unavailable. Try again later.',
  },
}
```

### `es/orders.ts`

```ts
export const orders = {
  title: {
    buy: 'Comprar {{ticker}}',
    sell: 'Vender {{ticker}}',
  },
  description: 'Enviá una orden de mercado o límite.',
  side: {
    label: 'Lado',
    BUY: 'Comprar',
    SELL: 'Vender',
  },
  type: {
    label: 'Tipo de orden',
    MARKET: 'Mercado',
    LIMIT: 'Límite',
  },
  fields: {
    quantity: 'Cantidad (acciones)',
    amount: 'Monto (ARS)',
    limitPrice: 'Precio límite',
    estimatedTotal: 'Total estimado',
    availableCash: 'Efectivo disponible',
    availableShares: 'Acciones disponibles',
  },
  hints: {
    amount: 'Las acciones se calculan con el último precio.',
    limit: 'El total estimado usa el precio límite.',
  },
  actions: {
    cancel: 'Cancelar',
    submitBuy: 'Comprar',
    submitSell: 'Vender',
    submitting: 'Enviando...',
    newOrder: 'Nueva orden',
    close: 'Cerrar',
  },
  result: {
    title: 'Resultado de la orden',
    filled: 'La orden se ejecutó correctamente.',
    pending: 'La orden fue enviada y está pendiente de ejecución.',
    rejected: 'La orden fue rechazada.',
    orderId: 'Orden #{{id}}',
  },
  status: {
    PENDING: 'Pendiente',
    FILLED: 'Ejecutada',
    REJECTED: 'Rechazada',
  },
  errors: {
    instrumentNotFound: 'Este instrumento ya no está disponible.',
    session: 'Tu sesión no está disponible. Recargá la página.',
    unknown: 'No se pudo completar la orden.',
    lastPriceUnavailable: 'El último precio no está disponible. Intentá más tarde.',
  },
}
```

### `en/validation.ts`

```ts
export const validation = {
  quantityRequired: 'Enter a quantity.',
  quantityInteger: 'Quantity must be a whole number.',
  quantityMin: 'Quantity must be at least 1.',
  priceRequired: 'Enter a limit price.',
  pricePositive: 'Limit price must be greater than 0.',
  insufficientCash: 'The order exceeds your available cash.',
  insufficientShares: 'The order exceeds your available shares.',
  lastPriceUnavailable: 'The last price is unavailable.',
  noHolding: 'You do not have a position in this instrument.',
}
```

### `es/validation.ts`

```ts
export const validation = {
  quantityRequired: 'Ingresá una cantidad.',
  quantityInteger: 'La cantidad debe ser un número entero.',
  quantityMin: 'La cantidad debe ser al menos 1.',
  priceRequired: 'Ingresá un precio límite.',
  pricePositive: 'El precio límite debe ser mayor a 0.',
  insufficientCash: 'La orden supera tu efectivo disponible.',
  insufficientShares: 'La orden supera tus acciones disponibles.',
  lastPriceUnavailable: 'El último precio no está disponible.',
  noHolding: 'No tenés una posición en este instrumento.',
}
```

The ES files must satisfy the EN namespace types.

## 9. Styling

- Modal uses the shared `Modal` component.
- Form uses a single column on mobile, two columns on desktop where appropriate.
- Segmented controls are full width.
- Summary is a highlighted surface inside the form.
- Positive/negative totals use tone tokens.
- Submit is primary; cancel is secondary.
- Result view is centered, with a clear status badge and id.
- Raw status code is small and muted.
- Loading/disabled states are obvious.
- No horizontal overflow at 375 px.

## 10. Tests

### `linkedFields.test.ts`

- quantity to amount
- amount to floored quantity
- fractional amount never produces fractional shares
- zero/invalid last price returns `null`
- non-finite inputs return `null`

### `validation.test.ts`

- valid MARKET BUY
- valid LIMIT BUY
- valid MARKET SELL
- missing quantity
- fractional quantity
- zero/negative quantity
- LIMIT without price
- LIMIT price `<= 0`
- BUY insufficient cash for MARKET
- BUY insufficient cash for LIMIT uses the limit price
- SELL without holding
- SELL more than holding
- last price `0` for MARKET
- `estimatedTotal` calculation for both types

### `errorMapping.test.ts`

- maps each known server message
- maps network/timeout/5xx
- falls back to unknown

### `orderModal.test.tsx`

1. renders title, fields and availability from the portfolio
2. hides the limit price for MARKET
3. shows the limit price for LIMIT
4. quantity → amount updates
5. amount → quantity floors
6. SELL preset quantity from portfolio fills quantity and amount
7. invalid submit shows localized errors and does not call the API
8. valid MARKET BUY sends the correct payload
9. valid LIMIT BUY includes `price`
10. FILLED response shows order id and translated status plus raw code
11. PENDING response shows the pending message
12. `400 Insufficient cash` shows a localized rejection and no id
13. double-click while pending sends only one request
14. portfolio query is invalidated after success
15. EN/ES copy switches correctly
16. last price `0` disables submit and shows the unavailable message

Use MSW to capture requests and return fixtures. Use a test `QueryClient` and spy on `invalidateQueries`.

### `OrderModalContainer.test.tsx`

- renders nothing when the ticket is closed
- opens the modal from `OrderTicketProvider` with the selected instrument and side
- passes portfolio cash/holdings through to the modal
- shows a spinner while the portfolio query is pending
- shows the portfolio error state and retries it
- closes the modal through `close()`

This verifies the app-layer composition. Feature-level tests can render `OrderModal` directly with explicit props.

## 11. Acceptance criteria

- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass.
- Clicking an instrument opens the modal with the correct side and preset quantity.
- Quantity/amount are linked through the last price; limit price is independent.
- LIMIT shows the price field; MARKET does not.
- No fractional shares can be submitted.
- BUY uses cash; SELL uses available shares; LIMIT BUY validates against the limit price.
- The result shows the returned `id` and `status` (translated label + raw code).
- HTTP validation errors are shown as localized rejections.
- The portfolio query is invalidated after success.
- Mutations never retry.
- EN/ES parity passes.
- The modal is keyboard-accessible and responsive at 375 px.

## 12. Out of scope

- Order history
- Cancel/modify order
- Partial fills
- Server-side price simulation
- Charts or advanced order types

## 13. Agent notes

- Do not change the context API or `OrderTicketProvider`.
- Keep `OrderModalContainer` mounted in the layout; replace only its stub body.
- Use `MoneyText`/`PercentText`/`Input`/`SegmentedControl`/`Badge`/`Modal` from `shared/ui`.
- `usePortfolio` is imported only by `src/app/layout/OrderModalContainer.tsx`. The order feature stays free of feature-to-feature imports.
- Use `orderErrorMessageKey` for API errors; do not hardcode English messages.
- Run `npm run format` after creating files.
