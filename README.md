# CP Invest — frontend challenge

A React app to browse instruments, search them by ticker, view a portfolio and send market or limit orders against the challenge API.

> This README is a skeleton. Full documentation (architecture, decisions, QA notes) lands in spec 07.

## Stack

React 19 · TypeScript 5.9 · Vite 8 · React Router 7 · TanStack Query 5 · Sass + CSS Modules · i18next (ES/EN) · Radix Dialog · lucide-react · Vitest + Testing Library + MSW.

Node.js >= 22 and npm are required.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional
npm run dev
```

## Scripts

| Script                            | What it does                                      |
| --------------------------------- | ------------------------------------------------- |
| `npm run dev`                     | Start the Vite dev server                         |
| `npm run build`                   | Type-check and build for production               |
| `npm run preview`                 | Serve the production build                        |
| `npm run lint` / `lint:fix`       | Run ESLint (and fix)                              |
| `npm run format` / `format:check` | Run Prettier (write / check)                      |
| `npm run typecheck`               | Type-check the app without emitting               |
| `npm run test` / `test:watch`     | Run Vitest once / in watch mode                   |
| `npm run test:coverage`           | Run tests with V8 coverage                        |
| `npm run api:types`               | Regenerate API types from `docs/api/openapi.yaml` |
| `npm run api:types:check`         | Fail if generated types are out of date           |

## Environment variables

| Variable            | Default                              | Purpose                                                                            |
| ------------------- | ------------------------------------ | ---------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | `https://dummy-api-topaz.vercel.app` | API origin                                                                         |
| `VITE_CANDIDATE_ID` | —                                    | Fixed candidate key. Empty: reuse `localStorage["cp.candidateId"]` or generate one |
| `VITE_API_BUG_MODE` | `off`                                | Sent as `X-Enable-Bugs`. Keep `off`; other modes are for manual QA only            |

Every request sends `X-Enable-Bugs` and `X-Candidate-Id`; the API rejects requests without them. See [`docs/api/README.md`](./docs/api/README.md).

## Project docs

- [`specs/`](./specs/) — implementation specs, executed in order
- [`sessions/`](./sessions/) — decision records
- [`AGENTS.md`](./AGENTS.md) — rules for coding agents
