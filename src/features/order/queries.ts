import { useQuery } from '@tanstack/react-query'
import { compareNewestFirst } from '@/entities/order/model/metrics'
import { queryKeys } from '@/shared/api/queryKeys'
import { getOrders } from './api'

/** The candidate's orders, newest first (the API returns them oldest first). */
export function usePlacedOrders() {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: ({ signal }) => getOrders(signal),
    select: (orders) => orders.toSorted(compareNewestFirst),
    staleTime: 30_000,
  })
}
