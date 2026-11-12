import { useQuery } from '@tanstack/react-query'
import { compareNewestFirst } from '@/entities/order/model/metrics'
import { queryKeys } from '@/shared/api/queryKeys'
import type { Order } from '@/shared/api/types'
import { getOrders } from './api'

// Module-level so `select` keeps one reference and does not re-sort on every render.
const newestFirst = (orders: Order[]) => orders.toSorted(compareNewestFirst)

/** The candidate's orders, newest first (the API returns them oldest first). */
export function usePlacedOrders() {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: ({ signal }) => getOrders(signal),
    select: newestFirst,
  })
}
