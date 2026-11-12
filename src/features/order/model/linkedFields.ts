import { floorShares, isFiniteNumber, round2 } from '@/shared/lib/math'

function isValidPair(value: number, lastPrice: number): boolean {
  return isFiniteNumber(value) && isFiniteNumber(lastPrice) && lastPrice > 0
}

export function amountFromQuantity(quantity: number, lastPrice: number): number | null {
  return isValidPair(quantity, lastPrice) ? round2(quantity * lastPrice) : null
}

export function quantityFromAmount(amount: number, lastPrice: number): number | null {
  return isValidPair(amount, lastPrice) ? floorShares(amount, lastPrice) : null
}
