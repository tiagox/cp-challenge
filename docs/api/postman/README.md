# Postman collection — Cocos Challenge API

Manual and automated API checks for the live challenge API.

- Collection: [`cocos-challenge.postman_collection.json`](./cocos-challenge.postman_collection.json)
- Base URL: `https://dummy-api-topaz.vercel.app`
- API notes: `specs/00-api-contract.md`

## Import

1. Open Postman.
2. Choose **Import** and select `cocos-challenge.postman_collection.json`.
3. Open the collection variables and confirm:
   - `baseUrl` = `https://dummy-api-topaz.vercel.app`
   - `bugMode` = `off`

## Run

Use the Collection Runner and run the folders in order:

| Folder | Purpose |
|---|---|
| `00 - Setup` | Generate a fresh candidate and discover a live instrument |
| `01 - Instruments` | `GET /instruments` and missing-header behavior |
| `02 - Portfolio` | `GET /portfolio` and candidate-header behavior |
| `03 - Search` | Ticker search, no results and empty query |
| `04 - Orders` | MARKET/LIMIT success paths, portfolio effects and validation errors |
| `05 - Diagnostics` | CORS preflight for the custom headers |

Running the whole collection starts from a new anonymous candidate with:

```json
{ "cash": 1000000, "holdings": [] }
```

That makes the order assertions deterministic. If you skip `00 - Setup`, the collection reuses the current `candidateId` and its existing cash/holdings.

### Command line

```bash
npx newman run docs/api/postman/cocos-challenge.postman_collection.json
```

Reuse a specific candidate:

```bash
npx newman run docs/api/postman/cocos-challenge.postman_collection.json \
  --env-var "candidateId=my-test-candidate"
```

## Variables

| Variable | Default | Meaning |
|---|---|---|
| `baseUrl` | live API | API origin |
| `candidateId` | auto-generated | Anonymous candidate key sent as `X-Candidate-Id` |
| `bugMode` | `off` | Value sent as `X-Enable-Bugs`; keep `off` |
| `instrumentId` | discovered | Instrument used by order requests |
| `ticker` | discovered | Ticker used by search assertions |
| `query` | discovered | First three ticker characters |
| `noResultsQuery` | `ZZZZZZ` | Query expected to return no results |
| `orderQuantity` | `2` | MARKET BUY seed quantity |
| `sellQuantity` | `1` | Quantity sold by the SELL tests |
| `limitPrice` | `40.50` | Price used by LIMIT tests |
| `startingCash` | captured | Cash reported by the fresh candidate |
| `orderId` | captured | Latest order id |
| `seedOrderId` | captured | MARKET BUY seed order id |
| `limitBuyOrderId` | captured | LIMIT BUY order id |
| `sellOrderId` | captured | MARKET SELL order id |
| `limitSellOrderId` | captured | LIMIT SELL order id |

`candidateId` is generated once per collection run when empty and stored in collection variables. Set it manually to reuse a candidate across runs.

## What is verified

- Required `X-Enable-Bugs` and `X-Candidate-Id` headers.
- New-candidate starting state.
- Instrument shape and supported types.
- Portfolio shape and holding shape.
- Search by ticker, no matches and empty-query behavior.
- `POST /orders` returns `201` with the full order.
- MARKET BUY changes cash and creates a holding.
- MARKET orders return `FILLED`.
- LIMIT orders return `PENDING` or `REJECTED`.
- Server validation messages:
  - insufficient cash
  - insufficient shares
  - fractional quantity
  - missing LIMIT price
  - unknown instrument
  - missing candidate header
  - missing bug header
- CORS preflight allows both custom headers.

## Important notes

- This collection hits the **live API** and creates real orders for the generated candidate. It does not affect the application UI or another candidate.
- The server intentionally provides bug modes (`easy`, `medium`, `hard`). Do not use them for normal verification; they corrupt responses.
- The order tests assume `00 - Setup` ran first. `MARKET SELL` needs the seeded position, and `LIMIT SELL` needs one remaining share.
- The UI must still prevent invalid orders before submission. These requests verify server behavior, not the frontend.
- The API contract was verified on 2026-11-10. If the API changes, update this collection together with `specs/00-api-contract.md` and the future `docs/api/openapi.yaml`.
