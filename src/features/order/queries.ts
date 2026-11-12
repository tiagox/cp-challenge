import { useQuery, useQueryClient } from '@tanstack/react-query'
import { compareNewestFirst } from '@/entities/order/model/metrics'
import { queryKeys } from '@/shared/api/queryKeys'
import type { Order } from '@/shared/api/types'
import { getOrders } from './api'

// Module-level so `select` keeps one reference and does not re-sort on every render.
const newestFirst = (orders: Order[]) => orders.toSorted(compareNewestFirst)

// The API answers a LIMIT as PENDING and resolves it a few seconds later.
const PENDING_POLL_MS = 3_000
const countPending = (orders: Order[] | undefined) =>
  orders?.filter((order) => order.status === 'PENDING').length ?? 0

/** The candidate's orders, newest first (the API returns them oldest first). */
export function usePlacedOrders() {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: async ({ signal }) => {
      const before = queryClient.getQueryData<Order[]>(queryKeys.orders)
      const orders = await getOrders(signal)
      // A resolved order may have moved cash and holdings.
      if (countPending(orders) < countPending(before)) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.portfolio })
      }
      return orders
    },
    select: newestFirst,
    refetchInterval: (query) => (countPending(query.state.data) > 0 ? PENDING_POLL_MS : false),
  })
}
