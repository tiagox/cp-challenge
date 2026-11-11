import { describe, expect, it } from 'vitest'
import type { Holding } from './types'
import { aggregatePortfolio, marketValue, profitLoss, returnOnCost } from './metrics'

const holding = (overrides: Partial<Holding>): Holding => ({
  instrument_id: 1,
  ticker: 'TEST',
  quantity: 10,
  last_price: 10,
  close_price: 10,
  avg_cost_price: 10,
  ...overrides,
})

describe('marketValue', () => {
  it('multiplies quantity by last price', () => {
    expect(marketValue(10, 45.72)).toBeCloseTo(457.2)
    expect(marketValue(0, 45.72)).toBe(0)
  })

  it('returns 0 for non-finite input', () => {
    expect(marketValue(NaN, 10)).toBe(0)
    expect(marketValue(10, Infinity)).toBe(0)
  })
})

describe('profitLoss', () => {
  it('is positive when last price is above cost', () => {
    expect(profitLoss(10, 12, 10)).toBe(20)
  })

  it('is negative when last price is below cost', () => {
    expect(profitLoss(10, 8, 10)).toBe(-20)
  })

  it('is 0 at cost', () => {
    expect(profitLoss(10, 10, 10)).toBe(0)
  })

  it('returns 0 for non-finite input', () => {
    expect(profitLoss(10, NaN, 10)).toBe(0)
  })
})

describe('returnOnCost', () => {
  it('computes positive and negative returns', () => {
    expect(returnOnCost(12, 10)).toBeCloseTo(20)
    expect(returnOnCost(8, 10)).toBeCloseTo(-20)
    expect(returnOnCost(10, 10)).toBe(0)
  })

  it('returns null for a zero, negative or invalid cost', () => {
    expect(returnOnCost(10, 0)).toBeNull()
    expect(returnOnCost(10, -1)).toBeNull()
    expect(returnOnCost(10, NaN)).toBeNull()
    expect(returnOnCost(Infinity, 10)).toBeNull()
  })
})

describe('aggregatePortfolio', () => {
  it('sums market value and cost basis across holdings', () => {
    const metrics = aggregatePortfolio([
      holding({ quantity: 10, last_price: 12, avg_cost_price: 10 }),
      holding({ quantity: 5, last_price: 8, avg_cost_price: 10 }),
    ])

    expect(metrics.marketValue).toBe(160)
    expect(metrics.costBasis).toBe(150)
    expect(metrics.profitLoss).toBe(10)
    expect(metrics.returnPercent).toBeCloseTo(6.6667, 3)
  })

  it('returns zeros and a null return for no holdings', () => {
    expect(aggregatePortfolio([])).toEqual({
      marketValue: 0,
      costBasis: 0,
      profitLoss: 0,
      returnPercent: null,
    })
  })

  it('returns a null return when the cost basis is 0', () => {
    const metrics = aggregatePortfolio([
      holding({ quantity: 10, last_price: 5, avg_cost_price: 0 }),
    ])

    expect(metrics.marketValue).toBe(50)
    expect(metrics.profitLoss).toBe(50)
    expect(metrics.returnPercent).toBeNull()
  })

  it('treats non-finite values as 0', () => {
    const metrics = aggregatePortfolio([
      holding({ quantity: 10, last_price: NaN, avg_cost_price: 10 }),
    ])

    expect(metrics.marketValue).toBe(0)
    expect(metrics.costBasis).toBe(100)
    expect(metrics.profitLoss).toBe(-100)
  })
})
