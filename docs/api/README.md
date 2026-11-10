# Cocos Challenge API — notes

Behavior of the challenge API that the OpenAPI file can't express. The contract itself lives in [`openapi.yaml`](./openapi.yaml); a Postman collection that checks it against the live API lives in [`postman/`](./postman/README.md).

Contract verified against the live API on **2026-11-10**. If the API changes, re-verify (see [Re-verifying the live API](#re-verifying-the-live-api)) and update `openapi.yaml`, the generated types and the Postman collection together.

## Base URL and headers

```text
https://dummy-api-topaz.vercel.app
```

Every request sends:

| Header | Value | Required by the server |
|---|---|---|
| `X-Enable-Bugs` | `off` | All endpoints. Missing or invalid → `400` |
| `X-Candidate-Id` | anonymous candidate key | `/portfolio` and `/orders`. Missing → `400` |
| `Accept` | `application/json` | — |
| `Content-Type` | `application/json` | Only when a body is sent |

The challenge brief doesn't mention either custom header. The client (`src/shared/api/http.ts`) sends both on every request, including endpoints where the candidate header is optional.

## Candidate ID

`X-Candidate-Id` scopes cash and holdings. Any non-empty string works; there is no registration. A new candidate starts with:

```json
{ "cash": 1000000, "holdings": [] }
```

The client resolves it in this order (`src/shared/api/config.ts`):

1. `VITE_CANDIDATE_ID`, if non-empty.
2. `localStorage["ccs.candidateId"]`, if non-empty.
3. A generated `crypto.randomUUID()` (with a timestamp/random fallback), persisted to `localStorage["ccs.candidateId"]`.

The candidate is never shown in the UI. To review the app with existing holdings, set `VITE_CANDIDATE_ID` to a candidate that already placed orders.

## Endpoints

| Method | Path | Success | Errors |
|---|---|---|---|
| `GET` | `/instruments` | `200 Instrument[]` | `400 Error` |
| `GET` | `/portfolio` | `200 Portfolio` | `400 Error` |
| `GET` | `/search?query=` | `200 Instrument[]` | `400 Error` |
| `POST` | `/orders` | `201 Order` | `400 Error` |

### `GET /instruments`

```json
[
  {
    "id": 1,
    "ticker": "DYCA",
    "name": "Dycasa S.A.",
    "type": "ACCIONES",
    "last_price": 45.72,
    "close_price": 50.07
  }
]
```

`type` is `ACCIONES` or `MONEDA`. Prices are in ARS.

### `GET /portfolio`

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

### `GET /search?query=`

- Case-insensitive **substring** match on `ticker` only (not `name`). `dyc` matches `DYCA`.
- An empty or missing `query` returns every instrument. The app only calls `/search` when the input has at least one non-whitespace character.
- No match returns `200 []`.

### `POST /orders`

MARKET:

```json
{ "instrument_id": 1, "side": "BUY", "type": "MARKET", "quantity": 1234 }
```

LIMIT (`price` is required and only sent for LIMIT):

```json
{ "instrument_id": 1, "side": "SELL", "type": "LIMIT", "quantity": 123, "price": 84.5 }
```

Response `201` (not `200`):

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

## Order statuses and validation

| Order type | Possible statuses |
|---|---|
| `MARKET` | `FILLED` (executes at `last_price`) or `REJECTED` |
| `LIMIT` | `PENDING` or `REJECTED` |

Server validation:

- `quantity` must be a positive integer. Fractions are rejected.
- BUY: cost must not exceed `cash`. **MARKET uses `last_price`; LIMIT uses the limit `price`.**
- SELL: `quantity` must not exceed the held quantity.
- LIMIT orders require a numeric `price`.
- `instrument_id` must exist.

Failed validation returns `400 { "error": "..." }`, **not** a `201` order with status `REJECTED`, even though the brief describes `REJECTED`. The UI still handles a `201` with `REJECTED` in case one arrives.

## Errors

All errors are `400` with an `Error` body:

```json
{ "error": "Insufficient cash" }
```

| Message | Meaning |
|---|---|
| `Insufficient cash` | BUY cost exceeds `cash` |
| `Insufficient shares` | SELL quantity exceeds holding |
| `quantity must be a positive number` | quantity is zero or negative |
| `quantity must be a positive integer` | fractional quantity |
| `LIMIT orders require a numeric price` | missing or invalid LIMIT price |
| `Instrument not found` | unknown `instrument_id` |
| `Missing X-Candidate-Id header` | missing candidate header |
| `X-Enable-Bugs must be off, easy, medium, or hard` | missing or invalid bug header |

The client turns every failure into an `ApiError` (`src/shared/api/errors.ts`) with a `code` of `HTTP`, `NETWORK`, `TIMEOUT`, `ABORTED` or `INVALID_RESPONSE`. For `HTTP`, `status` and `serverMessage` (the `error` field) are preserved. The UI maps known messages to translation keys.

## Bug modes

`X-Enable-Bugs` accepts `off`, `easy`, `medium` and `hard`. Every mode except `off` intentionally corrupts data or behavior (for example `last_price: 0`) and exists for manual QA only.

`off` is the only supported mode. The app defaults to it; `VITE_API_BUG_MODE` can override it for manual QA, and invalid values fall back to `off`. The product never exposes the other modes.

## CORS

`access-control-allow-origin` is `*`. The preflight echoes the requested headers, so `x-candidate-id`, `x-enable-bugs` and `content-type` are allowed from the browser.

## Generated types

`src/shared/api/generated/schema.ts` is generated from `openapi.yaml` by `openapi-typescript`. Never edit it by hand; import the aliases from `src/shared/api/types.ts`.

```bash
npm run api:types        # regenerate after editing openapi.yaml
npm run api:types:check  # regenerate and fail if the committed file is stale
```

## Re-verifying the live API

```bash
BASE=https://dummy-api-topaz.vercel.app
CANDIDATE="verify-$(date +%s)"

# Instruments
curl -s -H "X-Enable-Bugs: off" "$BASE/instruments"

# Fresh portfolio → {"cash":1000000,"holdings":[]}
curl -s -H "X-Enable-Bugs: off" -H "X-Candidate-Id: $CANDIDATE" "$BASE/portfolio"

# Search
curl -s -H "X-Enable-Bugs: off" "$BASE/search?query=dyc"

# MARKET BUY → 201
curl -s -w '\n%{http_code}\n' -X POST "$BASE/orders" \
  -H "X-Enable-Bugs: off" -H "X-Candidate-Id: $CANDIDATE" \
  -H "Content-Type: application/json" \
  -d '{"instrument_id":1,"side":"BUY","type":"MARKET","quantity":1}'

# Fractional quantity → 400 {"error":"quantity must be a positive integer"}
curl -s -w '\n%{http_code}\n' -X POST "$BASE/orders" \
  -H "X-Enable-Bugs: off" -H "X-Candidate-Id: $CANDIDATE" \
  -H "Content-Type: application/json" \
  -d '{"instrument_id":1,"side":"BUY","type":"MARKET","quantity":1.5}'

# Missing bug header → 400
curl -s -w '\n%{http_code}\n' "$BASE/instruments"

# CORS preflight
curl -s -i -X OPTIONS "$BASE/orders" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: x-candidate-id,x-enable-bugs,content-type" \
  | grep -i access-control
```

For a full automated run, use the [Postman collection](./postman/README.md).
