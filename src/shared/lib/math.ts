export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function round2(value: number): number {
  if (!isFiniteNumber(value)) return 0
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/** Whole shares an amount buys at `price`. Never fractional, never negative. */
export function floorShares(amount: number, price: number): number {
  if (!isFiniteNumber(amount) || !isFiniteNumber(price) || amount <= 0 || price <= 0) return 0
  return Math.floor(amount / price)
}
