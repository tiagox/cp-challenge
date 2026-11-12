import { describe, expect, it } from 'vitest'
import type { Order } from '@/shared/api/types'
import { filledOrder } from '@/test/fixtures/orders'
import { compareNewestFirst, orderTotal } from './metrics'

const order = (id: number, created_at: string): Order => ({ ...filledOrder, id, created_at })

describe('orderTotal', () => {
  it('multiplies quantity by price', () => {
    expect(orderTotal({ quantity: 10, price: 50.07 })).toBe(500.7)
  })

  it('rounds to cents', () => {
    expect(orderTotal({ quantity: 3, price: 0.335 })).toBe(1.01)
  })

  it.each([NaN, Infinity])('returns null for a non-finite value (%s)', (value) => {
    expect(orderTotal({ quantity: value, price: 1 })).toBeNull()
    expect(orderTotal({ quantity: 1, price: value })).toBeNull()
  })
})

describe('compareNewestFirst', () => {
  it('puts the newer order first', () => {
    const older = order(1, '2026-11-10T10:00:00Z')
    const newer = order(2, '2026-11-11T10:00:00Z')
    expect([older, newer].toSorted(compareNewestFirst)).toEqual([newer, older])
  })

  it('breaks ties by higher id first', () => {
    const low = order(1, '2026-11-10T10:00:00Z')
    const high = order(2, '2026-11-10T10:00:00Z')
    expect([low, high].toSorted(compareNewestFirst)).toEqual([high, low])
  })

  it('sorts an invalid date last', () => {
    const invalid = order(3, 'not a date')
    const valid = order(1, '2026-11-10T10:00:00Z')
    expect([invalid, valid].toSorted(compareNewestFirst)).toEqual([valid, invalid])
  })
})
