export type ApiErrorCode = 'NETWORK' | 'TIMEOUT' | 'ABORTED' | 'HTTP' | 'INVALID_RESPONSE'

export interface ApiErrorOptions {
  status?: number
  serverMessage?: string
  body?: unknown
  cause?: unknown
}

/**
 * The only error type thrown by the HTTP client. Messages are not localized;
 * the UI maps `serverMessage` to translation keys.
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly serverMessage?: string
  readonly body?: unknown

  constructor(code: ApiErrorCode, message: string, options: ApiErrorOptions = {}) {
    super(message, { cause: options.cause })
    this.name = 'ApiError'
    this.code = code
    this.status = options.status ?? 0
    this.serverMessage = options.serverMessage
    this.body = options.body
  }
}

export function getServerMessage(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null || !('error' in body)) return undefined
  return typeof body.error === 'string' ? body.error : undefined
}

/** Translation key for a failed query's retry state. */
export function errorKey(error: unknown) {
  if (error instanceof ApiError && error.code === 'NETWORK') return 'errors.network'
  if (error instanceof ApiError && error.code === 'TIMEOUT') return 'errors.timeout'
  return 'errors.server'
}
