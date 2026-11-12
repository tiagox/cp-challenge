import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/api/errors'
import { orderErrorMessageKey } from './errorMapping'

const httpError = (serverMessage: string, status = 400) =>
  new ApiError('HTTP', serverMessage, { status, serverMessage })

describe('orderErrorMessageKey', () => {
  it.each([
    ['Insufficient cash', 'validation.insufficientCash'],
    ['Insufficient shares', 'validation.insufficientShares'],
    ['quantity must be a positive integer', 'validation.quantityInteger'],
    ['quantity must be a positive number', 'validation.quantityInteger'],
    ['LIMIT orders require a numeric price', 'validation.priceRequired'],
    ['Instrument not found', 'orders.errors.instrumentNotFound'],
    ['Missing X-Candidate-Id header', 'orders.errors.session'],
  ])('maps "%s"', (message, key) => {
    expect(orderErrorMessageKey(httpError(message))).toBe(key)
  })

  it('maps network, timeout, aborted and 5xx errors', () => {
    expect(orderErrorMessageKey(new ApiError('NETWORK', 'x'))).toBe('errors.network')
    expect(orderErrorMessageKey(new ApiError('TIMEOUT', 'x'))).toBe('errors.timeout')
    expect(orderErrorMessageKey(new ApiError('ABORTED', 'x'))).toBe('errors.unexpected')
    expect(orderErrorMessageKey(httpError('boom', 503))).toBe('errors.server')
  })

  it('falls back to the unknown error', () => {
    expect(orderErrorMessageKey(httpError('Something new'))).toBe('orders.errors.unknown')
    expect(orderErrorMessageKey(new Error('x'))).toBe('orders.errors.unknown')
  })
})
