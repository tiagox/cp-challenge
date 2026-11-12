import { ApiError } from '@/shared/api/errors'

export type OrderErrorKey =
  | 'validation.insufficientCash'
  | 'validation.insufficientShares'
  | 'validation.quantityInteger'
  | 'validation.priceRequired'
  | 'orders.errors.instrumentNotFound'
  | 'orders.errors.session'
  | 'orders.errors.unknown'
  | 'errors.network'
  | 'errors.timeout'
  | 'errors.unexpected'
  | 'errors.server'

const serverMessageKeys: Record<string, OrderErrorKey> = {
  'Insufficient cash': 'validation.insufficientCash',
  'Insufficient shares': 'validation.insufficientShares',
  'quantity must be a positive integer': 'validation.quantityInteger',
  'quantity must be a positive number': 'validation.quantityInteger',
  'LIMIT orders require a numeric price': 'validation.priceRequired',
  'Instrument not found': 'orders.errors.instrumentNotFound',
  'Missing X-Candidate-Id header': 'orders.errors.session',
}

export function orderErrorMessageKey(error: unknown): OrderErrorKey {
  if (!(error instanceof ApiError)) return 'orders.errors.unknown'
  const byMessage = error.serverMessage ? serverMessageKeys[error.serverMessage] : undefined
  if (byMessage) return byMessage
  if (error.code === 'NETWORK') return 'errors.network'
  if (error.code === 'TIMEOUT') return 'errors.timeout'
  if (error.code === 'ABORTED') return 'errors.unexpected'
  if (error.status >= 500) return 'errors.server'
  return 'orders.errors.unknown'
}
