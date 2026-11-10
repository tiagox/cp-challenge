# Spec 00 — API Contract & Typed Client

| | |
|---|---|
| **Status** | Ready |
| **Depends on** | Nothing (repo is empty except `frontend-challenge.md`) |
| **Owns** | Minimal scaffold, `docs/api/**`, `src/shared/api/**`, `.env.example`, API client tests |
| **Must not build** | App shell, pages, feature UI, i18n resources, theme, order form |

## 1. Goal

Turn the undocumented challenge API into a documented, type-safe contract and a small, testable HTTP client.

Deliver:

1. A valid OpenAPI 3.1 file.
2. Human-readable API notes covering behavior that OpenAPI cannot express.
3. Generated TypeScript DTOs.
4. A hand-written `fetch` client with required headers, timeout, abort and `ApiError`.
5. Unit tests for the client.
6. A minimal Vite/React/TypeScript scaffold so the client can be compiled and tested.

Spec 01 completes the tooling; this spec only creates what is needed to generate types and run client tests.

## 2. Hard constraints

- Package manager: **npm**.
- TypeScript: **`5.9.3` pinned**. Do not install TypeScript 7.
- Node: `>=22`.
- No Axios.
- No full codegen (no Orval, no generated hooks/client).
- Generated types are produced by `openapi-typescript` and never edited by hand.
- No app features, no pages, no Sass, no i18n in this spec.

## 3. Files owned

Create or modify only:

```text
package.json
package-lock.json
tsconfig.json
tsconfig.app.json
tsconfig.node.json
vite.config.ts
vitest.config.ts
index.html
src/main.tsx
src/App.tsx
src/vite-env.d.ts
.env.example

docs/api/openapi.yaml
docs/api/README.md

src/shared/api/config.ts
src/shared/api/http.ts
src/shared/api/errors.ts
src/shared/api/queryClient.ts
src/shared/api/types.ts
src/shared/api/generated/schema.ts
src/shared/api/config.test.ts
src/shared/api/http.test.ts
```

Do not create `src/app`, `src/pages`, `src/features`, `src/entities` or `src/shared/i18n` here.

## 4. Minimal scaffold

Because the repo is empty, bootstrap the final Vite stack minimally:

```bash
npm create vite@latest . -- --template react-ts
npm install
npm install -D typescript@5.9.3 openapi-typescript@7.13.0 vitest@5.1.0 jsdom@31.0.0 @types/node@26.6.6
```

Then:

- Set `"engines": { "node": ">=22" }`.
- Add `.env.example`:

```dotenv
VITE_API_BASE_URL=https://dummy-api-topaz.vercel.app
VITE_CANDIDATE_ID=
VITE_API_BUG_MODE=off
```

- Keep the scaffold’s React entry point runnable. Replace `src/App.tsx` with a minimal placeholder that renders `API contract ready` — no styling, no routing, no providers.
- Add `src/vite-env.d.ts` declarations for the three env vars.
- Configure `vitest.config.ts` with `environment: 'jsdom'` and a single test setup file placeholder. Do not add RTL/MSW yet; those come in spec 01.
- Make sure `npm run build` still works even though the placeholder is temporary.

## 5. OpenAPI contract

Create `docs/api/openapi.yaml` with `openapi: 3.1.0`.

### 5.1 Metadata

```yaml
info:
  title: Cocos Challenge API
  version: 1.0.0
  description: |
    External challenge API for instruments, portfolio, search and orders.
    All requests must send X-Enable-Bugs: off for deterministic behavior.
servers:
  - url: https://dummy-api-topaz.vercel.app
tags:
  - name: instruments
  - name: portfolio
  - name: search
  - name: orders
```

### 5.2 Reusable headers

Define in `components.parameters` and reference from every operation:

| Parameter | Header | Required | Schema |
|---|---|---|---|
| `EnableBugsHeader` | `X-Enable-Bugs` | yes | string enum `off`, `easy`, `medium`, `hard`; default `off` |
| `CandidateIdHeader` | `X-Candidate-Id` | yes for `/portfolio` and `/orders`; optional elsewhere | string, minLength 1 |

Descriptions must mention:

- `X-Enable-Bugs` is mandatory even when `off`.
- `X-Candidate-Id` scopes cash and holdings. A new candidate starts with `{"cash": 1000000, "holdings": []}`.
- The client sends both headers on every request.

### 5.3 Schemas

Use exactly these component names so generated type aliases remain stable.

```text
Instrument
Holding
Portfolio
OrderSide
OrderType
OrderStatus
MarketOrderRequest
LimitOrderRequest
CreateOrderRequest
Order
Error
```

#### `Instrument`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | integer | yes | |
| `ticker` | string | yes | uppercase ticker |
| `name` | string | yes | company/asset name |
| `type` | string enum | yes | `ACCIONES`, `MONEDA` |
| `last_price` | number | yes | ARS; may be `0` in QA bug modes |
| `close_price` | number | yes | ARS |

Example:

```json
{
  "id": 1,
  "ticker": "DYCA",
  "name": "Dycasa S.A.",
  "type": "ACCIONES",
  "last_price": 45.72,
  "close_price": 50.07
}
```

#### `Holding`

| Field | Type | Required |
|---|---|---|
| `instrument_id` | integer | yes |
| `ticker` | string | yes |
| `quantity` | integer | yes |
| `last_price` | number | yes |
| `close_price` | number | yes |
| `avg_cost_price` | number | yes |

#### `Portfolio`

| Field | Type | Required |
|---|---|---|
| `cash` | number | yes |
| `holdings` | array of `Holding` | yes |

Example:

```json
{
  "cash": 999542.8,
  "holdings": [
    {
      "instrument_id": 1,
      "ticker": "DYCA",
      "quantity": 10,
      "last_price": 45.72,
      "close_price": 50.07,
      "avg_cost_price": 45.72
    }
  ]
}
```

#### `OrderSide` / `OrderType` / `OrderStatus`

```yaml
OrderSide:
  type: string
  enum: [BUY, SELL]
OrderType:
  type: string
  enum: [MARKET, LIMIT]
OrderStatus:
  type: string
  enum: [PENDING, REJECTED, FILLED]
```

#### `MarketOrderRequest` / `LimitOrderRequest` / `CreateOrderRequest`

`CreateOrderRequest` is a `oneOf` discriminated by `type`.

`MarketOrderRequest`:

| Field | Type | Required | Notes |
|---|---|---|---|
| `instrument_id` | integer | yes | |
| `side` | `OrderSide` | yes | |
| `type` | `"MARKET"` | yes | |
| `quantity` | integer, minimum 1 | yes | no fractions |

`LimitOrderRequest` adds:

| Field | Type | Required | Notes |
|---|---|---|---|
| `price` | number, exclusiveMinimum 0 | yes | required only for LIMIT |

Document that LIMIT BUY cash validation uses the **limit price**, while MARKET uses `last_price`.

Example MARKET body:

```json
{
  "instrument_id": 1,
  "side": "BUY",
  "type": "MARKET",
  "quantity": 1234
}
```

Example LIMIT body:

```json
{
  "instrument_id": 1,
  "side": "SELL",
  "type": "LIMIT",
  "quantity": 123,
  "price": 84.5
}
```

#### `Order`

| Field | Type | Required |
|---|---|---|
| `id` | integer | yes |
| `candidate_id` | string | yes |
| `instrument_id` | integer | yes |
| `side` | `OrderSide` | yes |
| `type` | `OrderType` | yes |
| `quantity` | integer | yes |
| `price` | number | yes |
| `status` | `OrderStatus` | yes |
| `created_at` | string date-time | yes |

Example `201` response:

```json
{
  "id": 648128,
  "candidate_id": "test",
  "instrument_id": 1,
  "side": "BUY",
  "type": "MARKET",
  "quantity": 10,
  "price": 45.72,
  "status": "FILLED",
  "created_at": "2026-11-10T17:48:29.611Z"
}
```

#### `Error`

```yaml
Error:
  type: object
  required: [error]
  properties:
    error:
      type: string
```

Known error messages:

| Message | Meaning |
|---|---|
| `Insufficient cash` | BUY cost exceeds `cash` |
| `Insufficient shares` | SELL quantity exceeds holding |
| `quantity must be a positive number` | quantity is zero/negative |
| `quantity must be a positive integer` | fractional quantity |
| `LIMIT orders require a numeric price` | missing/invalid LIMIT price |
| `Instrument not found` | unknown `instrument_id` |
| `Missing X-Candidate-Id header` | missing candidate header |
| `X-Enable-Bugs must be off, easy, medium, or hard` | missing/invalid bug header |

### 5.4 Paths

| Method | Path | Success | Errors |
|---|---|---|---|
| GET | `/instruments` | `200 Instrument[]` | `400 Error` |
| GET | `/portfolio` | `200 Portfolio` | `400 Error` |
| GET | `/search?query=` | `200 Instrument[]` | `400 Error` |
| POST | `/orders` | `201 Order` | `400 Error` |

Search notes:

- `query` is an optional string.
- Matching is case-insensitive substring on ticker.
- An empty/missing query returns all instruments.
- The app only calls it with at least one non-whitespace character.

Orders notes:

- Returns `201`, not `200`.
- Validation failures are `400 { "error": "..." }`, not a `201` order with `REJECTED`.
- The UI still handles a hypothetical `201` with `REJECTED`.
- MARKET orders are filled immediately or rejected.
- LIMIT orders return `PENDING` or `REJECTED`.

## 6. Human-readable API notes

Create `docs/api/README.md` covering:

- Base URL and required headers.
- Candidate ID semantics and starting state.
- Endpoint table with request/response examples.
- Search behavior.
- Order statuses and server validation rules.
- Error response table.
- Bug modes: `off` is the only supported mode; other modes intentionally corrupt data/behavior and are for manual QA only.
- CORS: preflight allows `x-candidate-id` and `x-enable-bugs`.
- How to regenerate types:

```bash
npm run api:types
npm run api:types:check
```

- How to re-verify the live API with `curl` examples.
- A note that the contract was verified on **2026-11-10**; re-verify if the API changes.

## 7. Generated types

Add scripts:

```json
{
  "scripts": {
    "api:types": "openapi-typescript docs/api/openapi.yaml -o src/shared/api/generated/schema.ts",
    "api:types:check": "npm run api:types && git diff --exit-code -- src/shared/api/generated/schema.ts"
  }
}
```

Run `npm run api:types` and commit `src/shared/api/generated/schema.ts`.

Add `src/shared/api/types.ts`:

```ts
import type { components } from './generated/schema'

type Schemas = components['schemas']

export type Instrument = Schemas['Instrument']
export type Holding = Schemas['Holding']
export type Portfolio = Schemas['Portfolio']
export type OrderSide = Schemas['OrderSide']
export type OrderType = Schemas['OrderType']
export type OrderStatus = Schemas['OrderStatus']
export type MarketOrderRequest = Schemas['MarketOrderRequest']
export type LimitOrderRequest = Schemas['LimitOrderRequest']
export type CreateOrderRequest = Schemas['CreateOrderRequest']
export type Order = Schemas['Order']
export type ApiErrorBody = Schemas['Error']
```

If `openapi-typescript` names the union differently, adapt `types.ts`, not the generated file.

## 8. Client configuration

`src/shared/api/config.ts`:

```ts
export type BugMode = 'off' | 'easy' | 'medium' | 'hard'

export const API_BASE_URL: string
export const API_BUG_MODE: BugMode
export const CANDIDATE_STORAGE_KEY = 'ccs.candidateId'

export function resolveCandidateId(options?: {
  envValue?: string
  storage?: Pick<Storage, 'getItem' | 'setItem'>
}): string
```

Requirements:

- Default base URL: `https://dummy-api-topaz.vercel.app`.
- Strip trailing slashes from the base URL.
- Default bug mode: `off`. Invalid values fall back to `off`.
- Candidate resolution order:
  1. non-empty `envValue` / `import.meta.env.VITE_CANDIDATE_ID`
  2. `storage.getItem('ccs.candidateId')` if non-empty
  3. `crypto.randomUUID()` (fallback: `ccs-${Date.now()}-${Math.random().toString(36).slice(2)}`), then `storage.setItem(...)`
- Functions must be testable with injected storage/env values. Do not read `localStorage` at module top level.

## 9. HTTP client

`src/shared/api/http.ts` exports:

```ts
export interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  signal?: AbortSignal
  timeoutMs?: number
}

export async function request<T>(path: string, options?: RequestOptions): Promise<T>

export const http = {
  get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>,
  post<T>(path: string, body: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>,
}
```

Requirements:

- Build URL from `API_BASE_URL + path`.
- Headers on every request:
  - `Accept: application/json`
  - `X-Enable-Bugs: API_BUG_MODE`
  - `X-Candidate-Id: resolveCandidateId()`
- Add `Content-Type: application/json` only when a body exists.
- JSON-stringify the body.
- Timeout: default `15_000` ms. Combine the caller signal and timeout with `AbortSignal.any` when available; otherwise implement an equivalent `AbortController`.
- Read the response as text, then parse JSON if non-empty.
- On `!response.ok`, throw `ApiError`.
- On success with invalid JSON, throw `ApiError` with `code: 'INVALID_RESPONSE'`.
- No retries in the client.
- No direct `fetch` outside this file.

## 10. Error model

`src/shared/api/errors.ts`:

```ts
export type ApiErrorCode =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'ABORTED'
  | 'HTTP'
  | 'INVALID_RESPONSE'

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly serverMessage?: string
  readonly body?: unknown
}
```

Requirements:

- Extract `serverMessage` from `{ error: string }` when present.
- For non-JSON error bodies, use `response.statusText` or a generic message.
- Distinguish caller abort from timeout:
  - caller signal aborted → `ABORTED`
  - internal timeout → `TIMEOUT`
- Network failures → `NETWORK`.
- Preserve `status` for HTTP errors (`400`, `500`, etc.).
- Do not localize messages here; the UI maps messages to i18n keys later.

## 11. Query client

`src/shared/api/queryClient.ts`:

```ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) =>
        error instanceof ApiError &&
        (error.code === 'NETWORK' || error.status >= 500) &&
        failureCount < 1,
    },
    mutations: {
      retry: false,
    },
  },
})
```

Do not include a provider here; spec 02 wires it.

## 12. Tests

Create tests with Vitest. Use `vi.stubGlobal('fetch', ...)`; MSW arrives in spec 01.

### `config.test.ts`

- env candidate override wins
- stored candidate is reused
- generated candidate is persisted
- invalid bug mode falls back to `off`
- base URL trailing slash is normalized

### `http.test.ts`

- sends `X-Enable-Bugs` and `X-Candidate-Id`
- sends `Content-Type` only when a body exists
- sends JSON body
- parses JSON success
- throws `ApiError` on `400 { error }` and preserves `serverMessage`
- throws `ApiError` on non-JSON error body
- throws `INVALID_RESPONSE` on invalid JSON success
- throws `TIMEOUT` on timeout
- throws `ABORTED` when the caller signal aborts
- throws `NETWORK` on fetch rejection
- no retry behavior

Use fake timers or an injectable timeout where necessary to keep tests fast.

## 13. Acceptance criteria

- `docs/api/openapi.yaml` is valid OpenAPI 3.1 and `npm run api:types` succeeds.
- `src/shared/api/generated/schema.ts` exists and is committed.
- `npm run typecheck` passes.
- `npm run test` passes.
- `npm run build` passes.
- `npm run api:types:check` passes.
- `.env.example` exists and documents all three env vars.
- No direct `fetch` outside `src/shared/api/http.ts`.
- TypeScript is pinned to `5.9.3` in `package.json`.

## 14. Out of scope

- React Router, TanStack Query provider, app shell
- Sass, theme, i18n
- Feature API functions and query hooks
- UI components and pages
- MSW handlers and fixtures
- Order form or modal
- Full client codegen

## 15. Agent notes

- Run `npm run api:types` before writing `types.ts`.
- If `openapi-typescript` complains about TypeScript, confirm the project is on `5.9.3`.
- Exclude `src/shared/api/generated/**` from ESLint/Prettier in spec 01.
- Keep the OpenAPI file descriptive; the behavioral notes belong in `docs/api/README.md`.
- Do not let the temporary `App.tsx` grow into an app shell. Spec 01/02 replace it.
