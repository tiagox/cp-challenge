import { describe, expect, it } from 'vitest'
import { validateOrder, type OrderValidationInput } from './validation'

const base: OrderValidationInput = {
  side: 'BUY',
  type: 'MARKET',
  quantity: 10,
  limitPrice: null,
  lastPrice: 50,
  cash: 1000,
  availableShares: 0,
}

const validate = (overrides: Partial<OrderValidationInput>) =>
  validateOrder({ ...base, ...overrides })

describe('validateOrder', () => {
  it('accepts a MARKET BUY within cash', () => {
    expect(validate({})).toEqual({
      valid: true,
      errors: {},
      quantity: 10,
      effectivePrice: 50,
      estimatedTotal: 500,
    })
  })

  it('accepts a LIMIT BUY and totals at the limit price', () => {
    const result = validate({ type: 'LIMIT', limitPrice: 40.5 })
    expect(result.valid).toBe(true)
    expect(result.effectivePrice).toBe(40.5)
    expect(result.estimatedTotal).toBe(405)
  })

  it('accepts a MARKET SELL within the holding', () => {
    expect(validate({ side: 'SELL', availableShares: 10 }).valid).toBe(true)
  })

  it('requires a quantity', () => {
    const result = validate({ quantity: null })
    expect(result.errors.quantity).toBe('QUANTITY_REQUIRED')
    expect(result).toMatchObject({ valid: false, quantity: 0, estimatedTotal: 0 })
  })

  it('rejects fractional quantities', () => {
    expect(validate({ quantity: 1.5 }).errors.quantity).toBe('QUANTITY_INTEGER')
  })

  it('rejects zero and negative quantities', () => {
    expect(validate({ quantity: 0 }).errors.quantity).toBe('QUANTITY_MIN')
    expect(validate({ quantity: -2 }).errors.quantity).toBe('QUANTITY_MIN')
  })

  it('requires a limit price for LIMIT', () => {
    expect(validate({ type: 'LIMIT', limitPrice: null }).errors.price).toBe('PRICE_REQUIRED')
  })

  it('rejects a limit price of 0 or less', () => {
    expect(validate({ type: 'LIMIT', limitPrice: 0 }).errors.price).toBe('PRICE_POSITIVE')
    expect(validate({ type: 'LIMIT', limitPrice: -1 }).errors.price).toBe('PRICE_POSITIVE')
  })

  it('rejects a MARKET BUY above the available cash', () => {
    expect(validate({ quantity: 21 }).errors.quantity).toBe('INSUFFICIENT_CASH')
  })

  it('checks LIMIT BUY cash at the limit price, not the last price', () => {
    // 10 × 50 fits in 1,000 at the last price, but not at a 101 limit.
    expect(validate({ type: 'LIMIT', limitPrice: 101 }).errors.quantity).toBe('INSUFFICIENT_CASH')
    expect(validate({ type: 'LIMIT', limitPrice: 100, quantity: 10 }).valid).toBe(true)
  })

  it('rejects a SELL without a holding', () => {
    expect(validate({ side: 'SELL', availableShares: 0 }).errors.form).toBe('NO_HOLDING')
  })

  it('rejects a SELL above the holding', () => {
    expect(validate({ side: 'SELL', availableShares: 5 }).errors.quantity).toBe(
      'INSUFFICIENT_SHARES',
    )
  })

  it('flags an unavailable last price for MARKET', () => {
    const result = validate({ lastPrice: 0 })
    expect(result.errors.form).toBe('LAST_PRICE_UNAVAILABLE')
    expect(result.effectivePrice).toBe(0)
  })

  it('rounds the estimated total to cents for both types', () => {
    expect(validate({ quantity: 3, lastPrice: 10.005 }).estimatedTotal).toBe(30.02)
    expect(validate({ type: 'LIMIT', quantity: 3, limitPrice: 0.1 }).estimatedTotal).toBe(0.3)
  })
})
