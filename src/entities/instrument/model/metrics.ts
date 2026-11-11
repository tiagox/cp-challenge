import { isFiniteNumber } from '@/shared/lib/math'

/** (last - close) / close * 100. `null` when either price is invalid or close is not positive. */
export function returnPercent(lastPrice: number, closePrice: number): number | null {
  if (!isFiniteNumber(lastPrice) || !isFiniteNumber(closePrice) || closePrice <= 0) return null
  const result = ((lastPrice - closePrice) / closePrice) * 100
  return isFiniteNumber(result) ? result : null
}
