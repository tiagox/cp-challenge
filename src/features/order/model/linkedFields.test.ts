import { describe, expect, it } from 'vitest'
import { amountFromQuantity, quantityFromAmount } from './linkedFields'

describe('linked quantity and amount', () => {
  it('derives the amount from a quantity, rounded to cents', () => {
    expect(amountFromQuantity(3, 50.07)).toBe(150.21)
    expect(amountFromQuantity(3, 10.005)).toBe(30.02)
  })

  it('derives whole shares from an amount', () => {
    expect(quantityFromAmount(150.21, 50.07)).toBe(3)
    expect(quantityFromAmount(150.2, 50.07)).toBe(2)
  })

  it('never returns fractional shares', () => {
    for (const amount of [0.01, 49.99, 99.5, 1234.56]) {
      expect(Number.isInteger(quantityFromAmount(amount, 50.07))).toBe(true)
    }
  })

  it('returns null for a zero, negative or invalid last price', () => {
    expect(amountFromQuantity(1, 0)).toBeNull()
    expect(quantityFromAmount(100, -1)).toBeNull()
    expect(quantityFromAmount(100, Number.NaN)).toBeNull()
  })

  it('returns null for non-finite inputs', () => {
    expect(amountFromQuantity(Number.NaN, 10)).toBeNull()
    expect(amountFromQuantity(Infinity, 10)).toBeNull()
    expect(quantityFromAmount(Infinity, 10)).toBeNull()
  })
})
