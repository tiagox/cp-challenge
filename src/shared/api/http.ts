import { API_BASE_URL, API_BUG_MODE, resolveCandidateId } from './config'
import { ApiError, getServerMessage } from './errors'

export interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  signal?: AbortSignal
  timeoutMs?: number
}

export const DEFAULT_TIMEOUT_MS = 15_000

const NO_JSON = Symbol('no-json')

function parseJson(text: string): unknown {
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return NO_JSON
  }
}

function combineSignals(signals: AbortSignal[]): AbortSignal {
  if (signals.length === 1) return signals[0]
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
  const { method = 'GET', body, signal: callerSignal, timeoutMs = DEFAULT_TIMEOUT_MS } = options
  const hasBody = body !== undefined

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Enable-Bugs': API_BUG_MODE,
    'X-Candidate-Id': resolveCandidateId(),
  }
  if (hasBody) headers['Content-Type'] = 'application/json'

  const timeoutController = new AbortController()
  const timer = setTimeout(() => timeoutController.abort(), timeoutMs)
  const signal = combineSignals(
    callerSignal ? [callerSignal, timeoutController.signal] : [timeoutController.signal],
  )

  let response: Response
  let text: string
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: hasBody ? JSON.stringify(body) : undefined,
      signal,
    })
    text = await response.text()
  } catch (error) {
    if (callerSignal?.aborted) {
      throw new ApiError('ABORTED', 'Request aborted', { cause: error })
    }
    if (timeoutController.signal.aborted) {
      throw new ApiError('TIMEOUT', `Request timed out after ${timeoutMs} ms`, { cause: error })
    }
    throw new ApiError('NETWORK', 'Network request failed', { cause: error })
  } finally {
    clearTimeout(timer)
  }

  const parsed = parseJson(text)

  if (!response.ok) {
    const errorBody = parsed === NO_JSON ? text : parsed
    const serverMessage = getServerMessage(errorBody)
    throw new ApiError(
      'HTTP',
      serverMessage ?? (response.statusText || `Request failed with status ${response.status}`),
      { status: response.status, serverMessage, body: errorBody },
    )
  }

  if (parsed === NO_JSON) {
    throw new ApiError('INVALID_RESPONSE', 'Response is not valid JSON', {
      status: response.status,
      body: text,
    })
  }

  return parsed as T
}

export const http = {
  get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return request<T>(path, { ...options, method: 'GET' })
  },
  post<T>(path: string, body: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return request<T>(path, { ...options, method: 'POST', body })
  },
}
