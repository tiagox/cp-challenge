# Cocos Challenge API — bug levels

`X-Enable-Bugs` accepts `off`, `easy`, `medium` and `hard`. This report records what each level actually changes, so a manual QA pass knows what it is looking at and does not chase intentional corruption as a client bug. It is independent of the rest of the API documentation: everything needed to read it is repeated here.

Verified against the live API on **2026-11-12**.

The app ships `off` and never exposes the other levels. Nothing below changes the contract or the client implementation; `off` is the only supported mode.

## Scope and method

```text
Base URL: https://dummy-api-topaz.vercel.app
```

Every request in these probes sent:

```http
X-Enable-Bugs: <level>
X-Candidate-Id: probe-<level>-<random>
Accept: application/json
```

- Each probe used a fresh, throwaway candidate ID, so no probe saw another's cash or holdings. A new candidate starts at `{ "cash": 1000000, "holdings": [] }`.
- The levels are **cumulative**: `hard` contains every defect in `medium`, which contains every defect in `easy`. `off` is the clean baseline.
- Deterministic defects (zeroed price, case-sensitive search, status code) reproduced on every request. The `hard` defects marked *intermittent* were sampled repeatedly; they do not reproduce on every call, which is itself part of the finding.
- Probing used `/instruments`, `/search`, `/portfolio`, `POST /orders` and `GET /orders`. There are 26 instruments; `DYCA` (id 1) and `MIRG` (id 5) appear in most examples.

## Summary

| Behavior | `off` | `easy` | `medium` | `hard` |
|---|---|---|---|---|
| `GET /instruments` prices | correct | MIRG `last_price: 0` | same | same |
| `GET /search` matching | case-insensitive substring | case-sensitive | same | same |
| Successful `POST /orders` status | `201` | `201` | `200` | `200` |
| MARKET fill price | `last_price` | `last_price` | `last_price` | `close_price` |
| Fractional `quantity` | `400` positive integer | `400` | floored, accepted | floored, accepted |
| SELL with no or insufficient holdings | `400 Insufficient shares` | filled, cash credited | same | same |
| LIMIT SELL with no holdings | `400 Insufficient shares` | accepted `PENDING` | accepted | accepted |
| Order `status` accuracy | accurate | accurate | accurate | intermittent `PENDING` / phantom `FILLED` |
| `GET /portfolio` consistency | stable | stable | stable | intermittent stale snapshots |
| `GET /portfolio` holding fields | complete | complete | complete | intermittent missing `ticker` / `avg_cost_price` |
| `GET /orders` ordering | oldest first | oldest moved to the end | same | same |
| `GET /orders` fields and reads | complete, stable | complete, stable | complete, stable | complete, stable |
| `GET /orders` vs portfolio | consistent | consistent | consistent | `FILLED` orders with no cash/holding effect |
| Structural validation (headers, side, type, instrument, cash) | correct | correct | correct | correct |

## `easy`

Three independent defects. Everything else behaves like `off`.

### 1. One instrument reports `last_price: 0`

`/instruments` returns the same 26 instruments in the same order in every level, but in `easy` and above exactly one field changes:

| id | ticker | `off` | `easy` |
|---|---|---|---|
| 5 | MIRG | `last_price: 40.88` | `last_price: 0` |

No other instrument, field or ordering differs. The defect is deterministic: 15 consecutive reads returned `0` every time.

The zero price is **scoped to `/instruments`**. The same instrument still reports its true price everywhere else:

- `/search?query=MIRG` → `last_price: 40.88`
- `POST /orders` for MIRG fills at `40.88`
- `/portfolio` holdings show `last_price: 40.88`

The order engine never uses the zeroed price either: buying 30,000 MIRG is rejected with `400 Insufficient cash` in every level, so cash validation uses the real price.

### 2. Search loses case-insensitivity

Matching is still a substring match, but now case-sensitive, so only exact-case (uppercase) queries match:

| query | `off` | `easy` and above |
|---|---|---|
| `DYC` | 1 (DYCA) | 1 |
| `dyc` | 1 | 0 |
| `DyC` | 1 | 0 |
| `DYCa` | 1 | 0 |
| `CA` | 2 | 2 |
| `ca` | 2 | 0 |

An empty query still returns all 26 instruments, and unknown uppercase queries return `[]`.

### 3. The holdings check is removed from orders

A SELL is accepted regardless of what the candidate owns:

- Selling 10 DYCA with no position → `201 FILLED`, `holdings: []`, and cash **increases** by `quantity × price` (`1000000` → `1000457.2`, i.e. +457.2).
- Selling 10 when holding 2 → `201 FILLED`, the position is cleared and the excess is credited (`999908.56` → `1000365.76`).
- A LIMIT SELL with no holdings is accepted as `PENDING` (it is `400 Insufficient shares` in `off`).

This is effectively free money and the most damaging defect of the level.

## `medium`

Adds two defects on top of `easy`.

### 4. Successful orders return `200` instead of `201`

Both order types consistently return `200` for a created order (25 of 25 MARKET requests, plus LIMIT spot checks). `off` and `easy` return `201` for the same payloads. Validation failures are still `400`, so a client that only checks `response.ok` keeps working, but one that checks `status === 201` breaks.

### 5. Fractional quantities are silently floored

The integer check is replaced by a "positive number" check:

| requested `quantity` | `off` / `easy` | `medium` and above |
|---|---|---|
| `0.5`, `0.9` | `400 quantity must be a positive integer` | `400 quantity must be a positive number` |
| `1.1`, `1.5`, `1.9` | `400 quantity must be a positive integer` | `200`, `quantity: 1`, `FILLED` |
| `2.5`, `2.9` | `400 quantity must be a positive integer` | `200`, `quantity: 2`, `FILLED` |

The order is created with the floored quantity, so `1.9` buys one share and debits one share. A client that trusts the server to reject fractions can end up showing a different quantity than the user entered.

`quantity: 1.0` (an integer-valued float) is accepted in every level, including `off`; the discriminator is the value being a whole number, not the JSON number type.

## `hard`

Adds four defects on top of `medium`. Three of them are intermittent.

### 6. MARKET orders fill at `close_price`

The fill price, the cash debit and the position's `avg_cost_price` use `close_price` instead of `last_price`:

| ticker | `last_price` | `close_price` | order price in `hard` |
|---|---|---|---|
| DYCA | 45.72 | 50.07 | 50.07 |
| CAPX | 53.68 | 49.71 | 49.71 |
| MIRG | 40.88 (0 in `/instruments`) | 37.74 | 37.74 |

`/portfolio` holdings still report the true `last_price`, so a position can be created with `avg_cost_price` above its own `last_price` and appear to be at a loss immediately after a normal purchase. Example: buy 10 DYCA at 50.07, cash drops to `999499.3`, holding is `{ last_price: 45.72, avg_cost_price: 50.07 }`.

### 7. Order statuses become unreliable *(intermittent)*

- MARKET orders sometimes return `PENDING` instead of `FILLED`: observed in 0% to 25% of requests depending on the batch (0 of 20, then 9 of 36, then 1 of 10 concurrent). Quantity does not influence it (1, 2, 5, 10, 100, 1000 all showed it).
- The order is usually applied anyway. A `PENDING` MARKET BUY already showed the cash debit and the new holding 0.5 s later, so the status can contradict the portfolio.
- LIMIT orders sometimes return `FILLED` while creating no holding and changing no cash (1 of 8 at `price: 30`, 1 of 5 at `price: 50`).
- No `POST /orders` response returned `REJECTED` in any level. Rejections appear later in `GET /orders` (see below).

### 8. Portfolio reads alternate between snapshots *(intermittent)*

Repeated reads for the same candidate mostly return the current state, but sometimes return an older one. In a 30-read sample after two buys, 3 reads reverted to the state before the second buy. Polling the portfolio after a `PENDING` order alternated between `{ cash: 999499.3, holdings: [10] }` and `{ cash: 1000000, holdings: [] }` on consecutive calls.

### 9. Portfolio holdings lose fields *(intermittent)*

Holding objects sometimes omit `ticker` and/or `avg_cost_price`; `instrument_id`, `quantity`, `last_price` and `close_price` were always present. Across roughly 40 holding reads: `ticker` missing 5 times and `avg_cost_price` missing 3 times. Order responses themselves kept all 9 fields in 30 of 30 samples, so the corruption is portfolio-only.

## `GET /orders`

Returns the candidate's orders as `200 Order[]`. In `off` they are oldest first; `easy` and above rotate the list (see below).

Baseline behavior (`off`):

- A fresh candidate gets `[]`. The list is scoped to `X-Candidate-Id`; orders never leak between candidates.
- Both headers are required: missing `X-Candidate-Id` → `400 Missing X-Candidate-Id header`; missing or invalid `X-Enable-Bugs` → `400 X-Enable-Bugs must be off, easy, medium, or hard`.
- Query parameters are ignored. `?limit=1`, `?offset=1`, `?status=FILLED`, `?side=SELL` and `?sort=desc` all returned the full, unchanged list.
- Every order keeps all 9 fields (`id`, `candidate_id`, `instrument_id`, `side`, `type`, `quantity`, `price`, `status`, `created_at`). No missing fields, duplicates or stale reads were observed in any level: 15 consecutive reads of a 6-order list returned the identical array every time.
- Orders created under one level are visible under the others. The list is stored per candidate, not per level.
- In `off`, `easy` and `medium`, the list is the accurate view of a LIMIT order. `POST /orders` always answers `PENDING`; the server resolves it later to `FILLED` or `REJECTED`, and this endpoint shows the resolution. `hard` can disagree with the portfolio (see below).

### `easy` and above: the oldest order moves to the end

The array is rotated left by one: the first (oldest) order is appended after the newest. Confirmed with 2, 3, 5 and 6 orders, stable across repeated reads:

| seeded (oldest → newest) | `off` | `easy` / `medium` / `hard` |
|---|---|---|
| A, B, C | A, B, C | B, C, A |
| A, B, C, D, E | A, B, C, D, E | B, C, D, E, A |

With zero or one order there is nothing to move. Only the array order changes; every order keeps its contents. The app shows newest first, so it must sort by `created_at` rather than reverse the array: reversing the rotated list gives `A, E, D, C, B`, not `E, D, C, B, A`.

### `hard`: a `FILLED` order may have no effect

`hard` inherits the rotation and adds a status/portfolio contradiction: an order can be `FILLED` in this list while cash and holdings never changed, and a LIMIT order that `POST` reported as `FILLED` can later appear as `REJECTED` or `PENDING`. In 6 LIMIT BUY orders at `price: 50`, one was `FILLED` with an empty portfolio. The list itself stayed stable and complete, so the contradiction is between order status and portfolio state, not between list reads.

## What is not mode-related

These behave the same in `off`, so they are base API quirks, not injected bugs:

- **`LIMIT` with `price: 0` is accepted** as `PENDING`. The client must reject a non-positive limit price itself.
- **Pending order cash reservation is non-deterministic.** A pending LIMIT sometimes reserves `quantity × price`, sometimes nothing, and sometimes reserves and then reverts. Example in `off`: a LIMIT at `36.58` reserved 36.58 on the first read and was back to `1000000` moments later; a LIMIT at `100` reserved nothing.
- **LIMIT resolution is asynchronous and partly random.** `POST /orders` always answers `PENDING` for a LIMIT in every level. The server resolves the order within roughly 0.3–7.4 s: a BUY priced below `last_price` is always `REJECTED` (4 of 4 at `price: 30` against a last price of `45.72`), while at or above `last_price` it is a mixture of `FILLED` and `REJECTED` (at `45.72`: 3 fills and 1 rejection of 4; at `50`: 7 fills and 5 rejections of 12 across the four levels). The outcome cannot be predicted from the price; it has to be read from `GET /orders` or the portfolio. A LIMIT SELL with no holdings accepted in `easy` and above follows the same path and is typically rejected within 0.3–1.2 s.
- **Validation stays intact in every level**: missing or invalid `X-Enable-Bugs`, missing `X-Candidate-Id`, bad `side` or `type`, unknown `instrument_id`, zero or negative quantity, LIMIT without a price, and BUY cost above cash all return `400` with the documented message.

## What this means for the app

The client always sends `X-Enable-Bugs: off`, so none of the above reaches users. The levels are still useful for checking that the UI degrades honestly:

- `last_price: 0` (easy) must render as unavailable, disable submit, and never divide by it.
- Fractional quantities (medium) must be blocked in the form, because the server may floor them instead of rejecting.
- Missing `ticker` / `avg_cost_price` (hard) must degrade to a placeholder instead of throwing or printing `NaN`.
- A `PENDING` MARKET order and a stale portfolio snapshot (hard) must be shown as returned, without optimistic corrections.
- A LIMIT order's `PENDING` submit response is not final: the orders list can show `FILLED` or `REJECTED` seconds later, and cash/holdings only move when it fills. Refetch the orders list (and the portfolio) after submission instead of assuming the submit status is the outcome.
- The orders list is rotated in `easy` and above, so sort by `created_at` newest first. Do not reverse the returned array.

## Re-verifying

Run each request below and compare with the tables. Use a new candidate ID per level so the portfolio starts clean.

```bash
BASE=https://dummy-api-topaz.vercel.app

for MODE in off easy medium hard; do
  CID="verify-$MODE-$(date +%s)"
  echo "=== $MODE ==="

  # easy+: only MIRG should show last_price 0
  curl -s -H "X-Enable-Bugs: $MODE" "$BASE/instruments" \
    | python3 -c 'import json,sys; print([i for i in json.load(sys.stdin) if i["ticker"]=="MIRG"])'

  # easy+: lowercase query returns [] instead of DYCA
  curl -s -H "X-Enable-Bugs: $MODE" "$BASE/search?query=dyc"

  # easy+: SELL with no holdings should be rejected but is filled
  curl -s -X POST -H "Content-Type: application/json" \
    -H "X-Enable-Bugs: $MODE" -H "X-Candidate-Id: $CID" \
    -d '{"instrument_id":1,"side":"SELL","type":"MARKET","quantity":1}' "$BASE/orders"

  # medium+: fractional quantity is floored, hard: price is close_price
  curl -s -X POST -H "Content-Type: application/json" \
    -H "X-Enable-Bugs: $MODE" -H "X-Candidate-Id: $CID" \
    -d '{"instrument_id":1,"side":"BUY","type":"MARKET","quantity":1.5}' "$BASE/orders"

  # second order so the easy+ rotation in GET /orders is visible
  curl -s -X POST -H "Content-Type: application/json" \
    -H "X-Enable-Bugs: $MODE" -H "X-Candidate-Id: $CID" \
    -d '{"instrument_id":2,"side":"BUY","type":"MARKET","quantity":1}' "$BASE/orders"

  # off: oldest first; easy+: the oldest order is moved to the end
  curl -s -H "X-Enable-Bugs: $MODE" -H "X-Candidate-Id: $CID" "$BASE/orders" \
    | python3 -c 'import json,sys; print([(o["id"], o["created_at"][11:23], o["status"]) for o in json.load(sys.stdin)])'

  # the list requires the candidate header too → 400
  curl -s -o /dev/null -w '%{http_code}\n' -H "X-Enable-Bugs: $MODE" "$BASE/orders"

  # hard: repeat to catch stale snapshots and missing fields
  for i in 1 2 3 4 5; do
    curl -s -H "X-Enable-Bugs: $MODE" -H "X-Candidate-Id: $CID" "$BASE/portfolio"
  done
done
```

Expected: `easy` shows the zero price, a `[]` search result and a filled SELL; `medium` additionally returns `200` and flattens `1.5` to `1`; every level returns the orders list with the oldest first in `off` and the oldest moved to the end in `easy` and above, and `400` for the list request without a candidate; `hard` fills at `close_price` and may return `PENDING`, a stale portfolio or a holding without `ticker`.
