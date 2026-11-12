import { http } from '@/shared/api/http'
import type { CreateOrderRequest, Order } from '@/shared/api/types'

export async function createOrder(payload: CreateOrderRequest): Promise<Order> {
  return http.post<Order>('/orders', payload)
}
