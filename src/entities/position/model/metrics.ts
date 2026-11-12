import { returnPercent } from '@/entities/instrument/model/metrics'
import { isFiniteNumber } from '@/shared/lib/math'
import type { Holding } from './types'

export interface PortfolioMetrics {
  marketValue: number
  costBasis: number
  /** `null` when any holding has an invalid price: a partial sum would misstate the total. */
  profitLoss: number | null
  returnPercent: number | null
}

function finiteOrZero(value: number): number {
  return isFiniteNumber(value) ? value : 0
}

export function marketValue(quantity: number, lastPrice: number): number {
  return finiteOrZero(quantity * lastPrice)
}

/** `null` when any input is missing or not finite. */
export function profitLoss(
  quantity: number,
  lastPrice: number,
  avgCostPrice: number,
): number | null {
  const result = (lastPrice - avgCostPrice) * quantity
  return isFiniteNumber(result) ? result : null
}

/** (last - avg cost) / avg cost * 100: the instrument return formula with avg cost as the base. */
export const returnOnCost: (lastPrice: number, avgCostPrice: number) => number | null =
  returnPercent

export function aggregatePortfolio(holdings: Holding[]): PortfolioMetrics {
  let totalMarketValue = 0
  let costBasis = 0
  let complete = true

  for (const holding of holdings) {
    totalMarketValue += marketValue(holding.quantity, holding.last_price)
    costBasis += finiteOrZero(holding.quantity * holding.avg_cost_price)
    if (profitLoss(holding.quantity, holding.last_price, holding.avg_cost_price) === null) {
      complete = false
    }
  }

  const profit = complete ? totalMarketValue - costBasis : null
  const ratio = profit === null || costBasis === 0 ? null : (profit / costBasis) * 100

  return {
    marketValue: totalMarketValue,
    costBasis,
    profitLoss: profit,
    returnPercent: isFiniteNumber(ratio) ? ratio : null,
  }
}
