import { ApiError } from '@/shared/api/errors'

// Copy of InstrumentsPage's mapping; spec 08 may merge them.
export function errorKey(error: unknown) {
  if (error instanceof ApiError && error.code === 'NETWORK') return 'errors.network'
  if (error instanceof ApiError && error.code === 'TIMEOUT') return 'errors.timeout'
  return 'errors.server'
}
