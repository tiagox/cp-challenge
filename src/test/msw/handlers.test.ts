import { getResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/shared/api/config'
import { http } from '@/shared/api/http'
import { handlers } from './handlers'

const headers = { 'X-Enable-Bugs': 'off', 'X-Candidate-Id': 'test-candidate' }

// The HTTP client always sends both headers, so header rejection is checked against the
// handlers directly, without the network.
async function rawGet(path: string, init: HeadersInit) {
  const response = await getResponse(
    handlers,
    new Request(`${API_BASE_URL}${path}`, { headers: init }),
  )
  if (!response) throw new Error(`No handler for ${path}`)
  return { status: response.status, body: (await response.json()) as unknown }
}

describe('MSW handlers', () => {
  it('reject a missing X-Enable-Bugs header', async () => {
    const { status, body } = await rawGet('/instruments', { 'X-Candidate-Id': 'c' })
    expect(status).toBe(400)
    expect(body).toHaveProperty('error')
  })

  it('reject a bug mode other than off', async () => {
    const { status } = await rawGet('/instruments', { ...headers, 'X-Enable-Bugs': 'hard' })
    expect(status).toBe(400)
  })

  it('reject a missing X-Candidate-Id header', async () => {
    const { status, body } = await rawGet('/portfolio', { 'X-Enable-Bugs': 'off' })
    expect(status).toBe(400)
    expect(body).toEqual({ error: 'Missing X-Candidate-Id header' })
  })

  it('serve fixtures through the HTTP client', async () => {
    const instruments = await http.get<{ ticker: string }[]>('/instruments')
    expect(instruments.map((item) => item.ticker)).toEqual(['DYCA', 'CAPX', 'MIRG', 'ARS'])
  })

  it('filter search results by ticker, case-insensitively', async () => {
    const results = await http.get<{ ticker: string }[]>('/search?query=dy')
    expect(results.map((item) => item.ticker)).toEqual(['DYCA'])
  })

  it('return a FILLED order echoing the request', async () => {
    const order = await http.post<{ status: string; quantity: number; side: string }>('/orders', {
      instrument_id: 2,
      side: 'SELL',
      type: 'MARKET',
      quantity: 3,
    })
    expect(order).toMatchObject({ status: 'FILLED', quantity: 3, side: 'SELL' })
  })
})
