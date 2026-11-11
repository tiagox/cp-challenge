import type { Order } from '@/shared/api/types'

export const filledOrder = {
  id: 648128,
  candidate_id: 'test-candidate',
  instrument_id: 1,
  side: 'BUY',
  type: 'MARKET',
  quantity: 10,
  price: 50.07,
  status: 'FILLED',
  created_at: '2026-11-10T17:48:29.611Z',
} satisfies Order

export const pendingLimitOrder = {
  id: 648129,
  candidate_id: 'test-candidate',
  instrument_id: 2,
  side: 'SELL',
  type: 'LIMIT',
  quantity: 5,
  price: 54,
  status: 'PENDING',
  created_at: '2026-11-10T17:50:02.104Z',
} satisfies Order

export const rejectedOrder = {
  id: 648130,
  candidate_id: 'test-candidate',
  instrument_id: 1,
  side: 'BUY',
  type: 'MARKET',
  quantity: 1_000_000,
  price: 50.07,
  status: 'REJECTED',
  created_at: '2026-11-10T17:51:40.877Z',
} satisfies Order
