import { describe, expect, it } from 'vitest'
import { returnPercent } from './metrics'

describe('returnPercent', () => {
  it('computes a positive return', () => {
    expect(returnPercent(110, 100)).toBeCloseTo(10)
  })

  it('computes a negative return', () => {
    expect(returnPercent(45.72, 50.07)).toBeCloseTo(-8.6878, 3)
  })

  it('returns 0 when price is unchanged', () => {
    expect(returnPercent(1, 1)).toBe(0)
  })

  it('returns -100 when last price is 0', () => {
    expect(returnPercent(0, 37.74)).toBe(-100)
  })

  it.each([
    [10, 0],
    [10, -5],
    [NaN, 10],
    [10, NaN],
    [Infinity, 10],
    [10, Infinity],
  ])('returns null for last=%s close=%s', (last, close) => {
    expect(returnPercent(last, close)).toBeNull()
  })
})
