import { API_BASE_URL, API_BUG_MODE, resolveCandidateId } from './config'
import { ApiError, getServerMessage } from './errors'

export interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  signal?: AbortSignal
}

const TIMEOUT_MS = 15_000

function combineSignals(signals: AbortSignal[]): AbortSignal {
  const [first] = signals
  if (first && signals.length === 1) return first
  if (typeof AbortSignal.any === 'function') return AbortSignal.any(signals)

  const controller = new AbortController()
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason)
      break
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true })
  }
  return controller.signal
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal: callerSignal } = options
  const hasBody = body !== undefined

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Enable-Bugs': API_BUG_MODE,
    'X-Candidate-Id': resolveCandidateId(),
  }
  if (hasBody) headers['Content-Type'] = 'application/json'

  const timeoutController = new AbortController()
  const timer = setTimeout(() => timeoutController.abort(), TIMEOUT_MS)
  const signal = combineSignals(
    callerSignal ? [callerSignal, timeoutController.signal] : [timeoutController.signal],
  )

  let response: Response | undefined
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: hasBody ? JSON.stringify(body) : undefined,
      signal,
    })

    if (!response.ok) {
      // Gateways in front of the API can answer with HTML or plain text.
      const errorBody: unknown = await response.json().catch(() => undefined)
      const serverMessage = getServerMessage(errorBody)
      throw new ApiError(
        'HTTP',
        serverMessage ?? (response.statusText || `Request failed with status ${response.status}`),
        { status: response.status, serverMessage, body: errorBody },
      )
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (callerSignal?.aborted) {
      throw new ApiError('ABORTED', 'Request aborted', { cause: error })
    }
    if (timeoutController.signal.aborted) {
      throw new ApiError('TIMEOUT', `Request timed out after ${TIMEOUT_MS} ms`, { cause: error })
    }
    if (error instanceof SyntaxError) {
      throw new ApiError('INVALID_RESPONSE', 'Response is not valid JSON', {
        status: response?.status,
        cause: error,
      })
    }
    throw new ApiError('NETWORK', 'Network request failed', { cause: error })
  } finally {
    clearTimeout(timer)
  }
}

export const http = {
  get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return request<T>(path, { ...options, method: 'GET' })
  },
  post<T>(
    path: string,
    body: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ): Promise<T> {
    return request<T>(path, { ...options, method: 'POST', body })
  },
}
