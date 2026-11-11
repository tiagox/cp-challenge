import type { Holding, Portfolio } from '@/shared/api/types'

/** Bought below the last price: positive P&L. */
export const dycaHolding = {
  instrument_id: 1,
  ticker: 'DYCA',
  quantity: 10,
  last_price: 50.07,
  close_price: 45.72,
  avg_cost_price: 45,
} satisfies Holding

/** Bought above the last price: negative P&L. */
export const capxHolding = {
  instrument_id: 2,
  ticker: 'CAPX',
  quantity: 20,
  last_price: 49.71,
  close_price: 53.68,
  avg_cost_price: 55,
} satisfies Holding

export const portfolioFixture = {
  cash: 1_000_000,
  holdings: [dycaHolding, capxHolding],
} satisfies Portfolio
