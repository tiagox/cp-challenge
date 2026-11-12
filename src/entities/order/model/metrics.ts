import type { Order } from '@/shared/api/types'
import { isFiniteNumber, round2 } from '@/shared/lib/math'

/** quantity × price, rounded to cents. `null` when either value is not a finite number. */
export function orderTotal(order: Pick<Order, 'quantity' | 'price'>): number | null {
  if (!isFiniteNumber(order.quantity) || !isFiniteNumber(order.price)) return null
  return round2(order.quantity * order.price)
}

/** Sort comparator: newest `created_at` first; ties broken by higher `id` first. */
export function compareNewestFirst(a: Order, b: Order): number {
  const timeA = Date.parse(a.created_at)
  const timeB = Date.parse(b.created_at)
  // An unparseable date sorts last.
  const byTime =
    (Number.isNaN(timeB) ? -Infinity : timeB) - (Number.isNaN(timeA) ? -Infinity : timeA)
  return byTime || b.id - a.id
}
