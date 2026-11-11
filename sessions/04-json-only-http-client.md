---
session: 04
date: 2026-11-11
agent: claude-code
mode: build
title: HTTP client expects JSON responses
status: accepted
related_specs:
  - specs/00-api-contract.md
---

# Session 04 — HTTP client expects JSON responses

## 1. Context

Spec 00 §9 says the client should "read the response as text, then parse JSON if non-empty". The first implementation did that: it read the body with `response.text()`, parsed it with a helper that returned a sentinel for invalid JSON, and resolved `undefined` for an empty success body.

Every endpoint in the challenge API receives and returns JSON (`docs/api/openapi.yaml`). No endpoint returns an empty body.

## 2. Decision

`src/shared/api/http.ts` parses responses with `response.json()` directly.

- **Success:** `return await response.json()`. Invalid JSON throws a `SyntaxError`, mapped to `ApiError('INVALID_RESPONSE')` with the response status.
- **Error (`!response.ok`):** `await response.json().catch(() => undefined)`. A JSON body yields `serverMessage` from `{ error }`; a non-JSON body leaves `body` and `serverMessage` undefined and the message falls back to `statusText` or a generic text. The `HTTP` code and `status` are always preserved.
- **Empty success body:** no longer handled. It would surface as `INVALID_RESPONSE`.
- Body parsing stays inside the same `try` as `fetch`, so an abort or timeout while the body downloads still maps to `ABORTED` or `TIMEOUT`.

This replaces the "read as text" requirement of spec 00 §9. The spec's other client requirements and its required tests still hold.

## 3. Rationale

- The API is JSON-only, so text reading, the sentinel and empty-body handling were code paths with no real case behind them.
- Non-JSON **error** bodies still need a fallback. Gateways in front of the API (Vercel 502/504, function crashes) answer with HTML or plain text. Losing the status there would break the query retry rule, which retries on `status >= 500`.
- `INVALID_RESPONSE` is cheap to keep with `response.json()` and is required by spec 00.

## 4. Consequences

- For a non-JSON error, `ApiError.body` is `undefined` instead of the raw text. Nothing reads it beyond tests.
- The empty-body success test was removed; the non-JSON error test now expects `body` to be `undefined`.

## 5. Rejected alternatives

- **Keep the text-then-parse client.** More code for responses the API never sends.
- **Call `response.json()` without a fallback on errors.** A gateway HTML error would turn into a parse failure and lose the HTTP status.
- **Check `Content-Type` before parsing.** Still guesses the response type, which is what this decision removes.
