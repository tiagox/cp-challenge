import { http, HttpResponse } from 'msw'
import { API_BASE_URL } from '@/shared/api/config'
import type { CreateOrderRequest, Order } from '@/shared/api/types'
import { instrumentsFixture } from '../fixtures/instruments'
import { filledOrder, placedOrdersFixture } from '../fixtures/orders'
import { portfolioFixture } from '../fixtures/portfolio'

const url = (path: string) => `${API_BASE_URL}${path}`

/** Mirrors the live API: requests without the required headers fail like in production. */
function headerError(request: Request): Response | undefined {
  if (request.headers.get('X-Enable-Bugs') !== 'off') {
    return HttpResponse.json(
      { error: 'X-Enable-Bugs must be off, easy, medium, or hard' },
      { status: 400 },
    )
  }
  if (!request.headers.get('X-Candidate-Id')) {
    return HttpResponse.json({ error: 'Missing X-Candidate-Id header' }, { status: 400 })
  }
  return undefined
}

export const handlers = [
  http.get(url('/instruments'), ({ request }) => {
    return headerError(request) ?? HttpResponse.json(instrumentsFixture)
  }),

  http.get(url('/portfolio'), ({ request }) => {
    return headerError(request) ?? HttpResponse.json(portfolioFixture)
  }),

  http.get(url('/search'), ({ request }) => {
    const error = headerError(request)
    if (error) return error
    const query = (new URL(request.url).searchParams.get('query') ?? '').toLowerCase()
    return HttpResponse.json(
      instrumentsFixture.filter((instrument) => instrument.ticker.toLowerCase().includes(query)),
    )
  }),

  http.get(url('/orders'), ({ request }) => {
    return headerError(request) ?? HttpResponse.json(placedOrdersFixture)
  }),

  http.post(url('/orders'), async ({ request }) => {
    const error = headerError(request)
    if (error) return error
    const body = (await request.json()) as CreateOrderRequest
    const instrument = instrumentsFixture.find((item) => item.id === body.instrument_id)
    const order: Order = {
      ...filledOrder,
      instrument_id: body.instrument_id,
      side: body.side,
      type: body.type,
      quantity: body.quantity,
      price:
        'price' in body && body.price !== undefined ? body.price : (instrument?.last_price ?? 0),
    }
    return HttpResponse.json(order, { status: 201 })
  }),
]
