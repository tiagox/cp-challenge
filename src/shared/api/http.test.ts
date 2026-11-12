import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL, CANDIDATE_STORAGE_KEY } from './config'
import { ApiError, errorKey } from './errors'
import { http } from './http'

const CANDIDATE = 'test-candidate'

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function mockFetch(
  implementation: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
) {
  const fetchMock = vi.fn(implementation)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** A fetch that never settles until its signal aborts, like the real one. */
function hangingFetch() {
  return mockFetch(
    (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        const abort = () => reject(new DOMException('The operation was aborted.', 'AbortError'))
        if (init?.signal?.aborted) abort()
        init?.signal?.addEventListener('abort', abort)
      }),
  )
}

function sentHeaders(fetchMock: ReturnType<typeof mockFetch>) {
  return new Headers(fetchMock.mock.calls[0]?.[1]?.headers)
}

async function catchApiError(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  )
  expect(error).toBeInstanceOf(ApiError)
  return error as ApiError
}

beforeEach(() => {
  localStorage.setItem(CANDIDATE_STORAGE_KEY, CANDIDATE)
})

afterEach(() => {
  localStorage.clear()
  vi.useRealTimers()
})

describe('request headers and body', () => {
  it('sends X-Enable-Bugs and X-Candidate-Id', async () => {
    const fetchMock = mockFetch(async () => jsonResponse([]))

    await http.get('/instruments')

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/instruments`, expect.anything())
    const headers = sentHeaders(fetchMock)
    expect(headers.get('X-Enable-Bugs')).toBe('off')
    expect(headers.get('X-Candidate-Id')).toBe(CANDIDATE)
    expect(headers.get('Accept')).toBe('application/json')
  })

  it('omits Content-Type when there is no body', async () => {
    const fetchMock = mockFetch(async () => jsonResponse([]))

    await http.get('/instruments')

    expect(sentHeaders(fetchMock).has('Content-Type')).toBe(false)
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBeUndefined()
  })

  it('sends a JSON body with Content-Type', async () => {
    const fetchMock = mockFetch(async () => jsonResponse({ id: 1 }, { status: 201 }))
    const order = { instrument_id: 1, side: 'BUY', type: 'MARKET', quantity: 2 }

    await http.post('/orders', order)

    const init = fetchMock.mock.calls[0]?.[1]
    expect(init?.method).toBe('POST')
    expect(sentHeaders(fetchMock).get('Content-Type')).toBe('application/json')
    expect(init?.body).toBe(JSON.stringify(order))
  })
})

describe('responses', () => {
  it('parses a JSON success', async () => {
    mockFetch(async () => jsonResponse({ cash: 1000000, holdings: [] }))

    await expect(http.get('/portfolio')).resolves.toEqual({ cash: 1000000, holdings: [] })
  })

  it('throws ApiError with serverMessage on 400 { error }', async () => {
    mockFetch(async () => jsonResponse({ error: 'Insufficient cash' }, { status: 400 }))

    const error = await catchApiError(http.post('/orders', {}))

    expect(error.code).toBe('HTTP')
    expect(error.status).toBe(400)
    expect(error.serverMessage).toBe('Insufficient cash')
    expect(error.message).toBe('Insufficient cash')
    expect(error.body).toEqual({ error: 'Insufficient cash' })
  })

  it('throws ApiError on a non-JSON error body', async () => {
    mockFetch(
      async () =>
        new Response('<html>Bad gateway</html>', { status: 502, statusText: 'Bad Gateway' }),
    )

    const error = await catchApiError(http.get('/instruments'))

    expect(error.code).toBe('HTTP')
    expect(error.status).toBe(502)
    expect(error.serverMessage).toBeUndefined()
    expect(error.message).toBe('Bad Gateway')
    expect(error.body).toBeUndefined()
  })

  it('uses a generic message when the error has no status text', async () => {
    mockFetch(async () => new Response('', { status: 500 }))

    const error = await catchApiError(http.get('/instruments'))

    expect(error.message).toBe('Request failed with status 500')
  })

  it('throws INVALID_RESPONSE on an invalid JSON success', async () => {
    mockFetch(async () => new Response('not json', { status: 200 }))

    const error = await catchApiError(http.get('/instruments'))

    expect(error.code).toBe('INVALID_RESPONSE')
    expect(error.status).toBe(200)
  })
})

describe('failures', () => {
  it('throws TIMEOUT after 15 s', async () => {
    vi.useFakeTimers()
    hangingFetch()

    const pending = catchApiError(http.get('/instruments'))
    await vi.advanceTimersByTimeAsync(14_999)
    let settled = false
    void pending.then(() => (settled = true))
    await Promise.resolve()
    expect(settled).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    expect((await pending).code).toBe('TIMEOUT')
  })

  it('throws ABORTED when the caller signal aborts', async () => {
    hangingFetch()
    const controller = new AbortController()

    const pending = catchApiError(http.get('/instruments', { signal: controller.signal }))
    controller.abort()
    const error = await pending

    expect(error.code).toBe('ABORTED')
  })

  it('throws ABORTED when the caller signal is already aborted', async () => {
    hangingFetch()
    const controller = new AbortController()
    controller.abort()

    const error = await catchApiError(http.get('/instruments', { signal: controller.signal }))

    expect(error.code).toBe('ABORTED')
  })

  it('combines signals without AbortSignal.any', async () => {
    const original = Object.getOwnPropertyDescriptor(AbortSignal, 'any')
    Object.defineProperty(AbortSignal, 'any', { value: undefined, configurable: true })
    try {
      hangingFetch()
      const controller = new AbortController()

      const pending = catchApiError(http.get('/instruments', { signal: controller.signal }))
      controller.abort()

      expect((await pending).code).toBe('ABORTED')
    } finally {
      if (original) Object.defineProperty(AbortSignal, 'any', original)
    }
  })

  it('throws NETWORK when fetch rejects', async () => {
    mockFetch(async () => {
      throw new TypeError('Failed to fetch')
    })

    const error = await catchApiError(http.get('/instruments'))

    expect(error.code).toBe('NETWORK')
    expect(error.status).toBe(0)
    expect(error.cause).toBeInstanceOf(TypeError)
  })
})

describe('retries', () => {
  it('does not retry network failures', async () => {
    const fetchMock = mockFetch(async () => {
      throw new TypeError('Failed to fetch')
    })

    await catchApiError(http.post('/orders', {}))

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not retry server errors', async () => {
    const fetchMock = mockFetch(async () => jsonResponse({ error: 'boom' }, { status: 500 }))

    await catchApiError(http.get('/instruments'))

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('errorKey', () => {
  it('maps network, timeout and everything else', () => {
    expect(errorKey(new ApiError('NETWORK', 'x'))).toBe('errors.network')
    expect(errorKey(new ApiError('TIMEOUT', 'x'))).toBe('errors.timeout')
    expect(errorKey(new ApiError('HTTP', 'x', { status: 500 }))).toBe('errors.server')
    expect(errorKey(new Error('x'))).toBe('errors.server')
  })
})
