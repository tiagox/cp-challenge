import type { validation as enValidation } from '../en/validation'

export const validation = {
  quantityRequired: 'Ingresá una cantidad.',
  quantityInteger: 'La cantidad debe ser un número entero.',
  quantityMin: 'La cantidad debe ser al menos 1.',
  priceRequired: 'Ingresá un precio límite.',
  pricePositive: 'El precio límite debe ser mayor a 0.',
  insufficientCash: 'La orden supera tu efectivo disponible.',
  insufficientShares: 'La orden supera tus acciones disponibles.',
  lastPriceUnavailable: 'El último precio no está disponible.',
  noHolding: 'No tenés una posición en este instrumento.',
} satisfies typeof enValidation
