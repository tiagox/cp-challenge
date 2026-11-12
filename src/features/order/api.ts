import { http } from '@/shared/api/http'
import type { CreateOrderRequest, Order } from '@/shared/api/types'

export async function createOrder(payload: CreateOrderRequest): Promise<Order> {
  return http.post<Order>('/orders', payload)
}

export async function getOrders(signal?: AbortSignal): Promise<Order[]> {
  return http.get<Order[]>('/orders', { signal })
}
