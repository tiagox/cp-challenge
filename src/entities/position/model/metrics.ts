import { returnPercent } from '@/entities/instrument/model/metrics'
import { isFiniteNumber } from '@/shared/lib/math'
import type { Holding } from './types'

export interface PortfolioMetrics {
  marketValue: number
  costBasis: number
  profitLoss: number
  returnPercent: number | null
}

function finiteOrZero(value: number): number {
  return isFiniteNumber(value) ? value : 0
}

export function marketValue(quantity: number, lastPrice: number): number {
  return finiteOrZero(quantity * lastPrice)
}

export function profitLoss(quantity: number, lastPrice: number, avgCostPrice: number): number {
  return finiteOrZero((lastPrice - avgCostPrice) * quantity)
}

/** (last - avg cost) / avg cost * 100: the instrument return formula with avg cost as the base. */
export const returnOnCost: (lastPrice: number, avgCostPrice: number) => number | null =
  returnPercent

export function aggregatePortfolio(holdings: Holding[]): PortfolioMetrics {
  let totalMarketValue = 0
  let costBasis = 0

  for (const holding of holdings) {
    totalMarketValue += marketValue(holding.quantity, holding.last_price)
    costBasis += finiteOrZero(holding.quantity * holding.avg_cost_price)
  }

  const profit = totalMarketValue - costBasis
  const ratio = costBasis === 0 ? null : (profit / costBasis) * 100

  return {
    marketValue: totalMarketValue,
    costBasis,
    profitLoss: profit,
    returnPercent: isFiniteNumber(ratio) ? ratio : null,
  }
}
