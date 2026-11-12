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

/** `GET /orders` sample in API order (oldest first), like the live API. */
export const placedOrdersFixture = [
  {
    id: 648200,
    candidate_id: 'test-candidate',
    instrument_id: 1,
    side: 'BUY',
    type: 'LIMIT',
    quantity: 20,
    price: 48.5,
    status: 'REJECTED',
    created_at: '2026-11-10T14:05:12.301Z',
  },
  {
    id: 648201,
    candidate_id: 'test-candidate',
    instrument_id: 2,
    side: 'BUY',
    type: 'MARKET',
    quantity: 10,
    price: 49.71,
    status: 'FILLED',
    created_at: '2026-11-11T09:30:45.120Z',
  },
  {
    id: 648202,
    candidate_id: 'test-candidate',
    instrument_id: 1,
    side: 'SELL',
    type: 'MARKET',
    quantity: 3,
    price: 50.07,
    status: 'FILLED',
    created_at: '2026-11-12T01:53:34.884Z',
  },
] satisfies Order[]
