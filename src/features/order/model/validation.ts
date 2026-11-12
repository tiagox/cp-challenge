import type { OrderSide, OrderType } from '@/shared/api/types'
import { isFiniteNumber, round2 } from '@/shared/lib/math'

export type OrderField = 'quantity' | 'amount' | 'price' | 'form'

export type OrderValidationCode =
  | 'QUANTITY_REQUIRED'
  | 'QUANTITY_INTEGER'
  | 'QUANTITY_MIN'
  | 'PRICE_REQUIRED'
  | 'PRICE_POSITIVE'
  | 'INSUFFICIENT_CASH'
  | 'INSUFFICIENT_SHARES'
  | 'LAST_PRICE_UNAVAILABLE'
  | 'NO_HOLDING'

export interface OrderValidationInput {
  side: OrderSide
  type: OrderType
  quantity: number | null
  amount: number | null
  limitPrice: number | null
  lastPrice: number
  cash: number
  availableShares: number
}

export interface OrderValidationResult {
  valid: boolean
  errors: Partial<Record<OrderField, OrderValidationCode>>
  quantity: number
  effectivePrice: number
  estimatedTotal: number
}

// Absorbs float noise like 0.1 + 0.2 when comparing a total to the available cash.
const CASH_TOLERANCE = 0.005

function quantityError(quantity: number | null): OrderValidationCode | undefined {
  if (quantity === null || !isFiniteNumber(quantity)) return 'QUANTITY_REQUIRED'
  if (!Number.isInteger(quantity)) return 'QUANTITY_INTEGER'
  if (quantity < 1) return 'QUANTITY_MIN'
  return undefined
}

function priceError(input: OrderValidationInput): OrderValidationCode | undefined {
  if (input.type !== 'LIMIT') return undefined
  if (input.limitPrice === null || !isFiniteNumber(input.limitPrice)) return 'PRICE_REQUIRED'
  if (input.limitPrice <= 0) return 'PRICE_POSITIVE'
  return undefined
}

export function validateOrder(input: OrderValidationInput): OrderValidationResult {
  const errors: OrderValidationResult['errors'] = {}

  const qtyError = quantityError(input.quantity)
  if (qtyError) errors.quantity = qtyError
  const prcError = priceError(input)
  if (prcError) errors.price = prcError
  if (input.type === 'MARKET' && !(isFiniteNumber(input.lastPrice) && input.lastPrice > 0)) {
    errors.form = 'LAST_PRICE_UNAVAILABLE'
  }

  const quantity = qtyError ? 0 : (input.quantity ?? 0)
  const price = input.type === 'LIMIT' ? input.limitPrice : input.lastPrice
  const effectivePrice = isFiniteNumber(price) && price > 0 ? price : 0
  const estimatedTotal = round2(quantity * effectivePrice)

  if (!errors.quantity) {
    if (input.side === 'BUY') {
      if (effectivePrice > 0 && estimatedTotal > input.cash + CASH_TOLERANCE) {
        errors.quantity = 'INSUFFICIENT_CASH'
      }
    } else if (!(input.availableShares > 0)) {
      errors.form = 'NO_HOLDING'
    } else if (quantity > input.availableShares) {
      errors.quantity = 'INSUFFICIENT_SHARES'
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    quantity,
    effectivePrice,
    estimatedTotal,
  }
}
