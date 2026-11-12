import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/shared/api/config'
import { queryKeys } from '@/shared/api/queryKeys'
import { filledOrder, pendingLimitOrder } from '@/test/fixtures/orders'
import { createTestQueryClient } from '@/test/render'
import { server } from '@/test/server'
import { usePlacedOrders } from './queries'

describe('usePlacedOrders', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('polls while an order is PENDING and refreshes the portfolio once it resolves', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    let status: 'PENDING' | 'FILLED' = 'PENDING'
    server.use(
      http.get(`${API_BASE_URL}/orders`, () =>
        HttpResponse.json([filledOrder, { ...pendingLimitOrder, status }]),
      ),
    )
    const queryClient = createTestQueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => usePlacedOrders(), { wrapper })
    await waitFor(() => expect(result.current.data?.[0]?.status).toBe('PENDING'))
    expect(invalidate).not.toHaveBeenCalled()

    status = 'FILLED'
    await act(() => vi.advanceTimersByTimeAsync(3_000))

    await waitFor(() => expect(result.current.data?.[0]?.status).toBe('FILLED'))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.portfolio })

    // Nothing pending: polling stops.
    invalidate.mockClear()
    const fetches = vi.fn()
    server.events.on('request:start', fetches)
    await act(() => vi.advanceTimersByTimeAsync(10_000))
    expect(fetches).not.toHaveBeenCalled()
    server.events.removeAllListeners()
  })
})
