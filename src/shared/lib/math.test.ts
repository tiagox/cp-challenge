import { describe, expect, it } from 'vitest'
import { floorShares, isFiniteNumber, round2, signTone } from './math'

describe('isFiniteNumber', () => {
  it('accepts finite numbers only', () => {
    expect(isFiniteNumber(0)).toBe(true)
    expect(isFiniteNumber(-1.5)).toBe(true)
    expect(isFiniteNumber(NaN)).toBe(false)
    expect(isFiniteNumber(Infinity)).toBe(false)
    expect(isFiniteNumber('1')).toBe(false)
    expect(isFiniteNumber(null)).toBe(false)
    expect(isFiniteNumber(undefined)).toBe(false)
  })
})

describe('round2', () => {
  it('rounds to two decimals', () => {
    expect(round2(1.005)).toBe(1.01)
    expect(round2(4572)).toBe(4572)
    expect(round2(10 * 45.72)).toBe(457.2)
    expect(round2(-1.234)).toBe(-1.23)
  })

  it('returns 0 for non-finite values', () => {
    expect(round2(NaN)).toBe(0)
    expect(round2(Infinity)).toBe(0)
  })
})

describe('floorShares', () => {
  it('returns whole shares for an amount', () => {
    expect(floorShares(4572, 45.72)).toBe(100)
    expect(floorShares(100, 45.72)).toBe(2)
    expect(floorShares(45.71, 45.72)).toBe(0)
  })

  it('returns 0 for invalid prices or amounts', () => {
    expect(floorShares(100, 0)).toBe(0)
    expect(floorShares(100, -1)).toBe(0)
    expect(floorShares(-100, 10)).toBe(0)
    expect(floorShares(NaN, 10)).toBe(0)
    expect(floorShares(100, Infinity)).toBe(0)
  })
})

describe('signTone', () => {
  it('colors by sign and keeps zero and invalid values neutral', () => {
    expect(signTone(12.5)).toBe('positive')
    expect(signTone(-0.01)).toBe('negative')
    expect(signTone(0)).toBe('neutral')
    expect(signTone(null)).toBe('neutral')
    expect(signTone(NaN)).toBe('neutral')
  })
})
