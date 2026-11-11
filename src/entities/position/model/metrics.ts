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

/** (last - avg cost) / avg cost * 100. `null` when avg cost is not positive or inputs are invalid. */
export function returnOnCost(lastPrice: number, avgCostPrice: number): number | null {
  if (!isFiniteNumber(lastPrice) || !isFiniteNumber(avgCostPrice) || avgCostPrice <= 0) return null
  const result = ((lastPrice - avgCostPrice) / avgCostPrice) * 100
  return isFiniteNumber(result) ? result : null
}

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
