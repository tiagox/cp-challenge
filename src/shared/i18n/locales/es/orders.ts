import type { orders as enOrders } from '../en/orders'

export const orders = {
  title: {
    buy: 'Comprar {{ticker}}',
    sell: 'Vender {{ticker}}',
  },
  description: 'Enviá una orden de mercado o límite.',
  side: {
    label: 'Lado',
    BUY: 'Comprar',
    SELL: 'Vender',
  },
  type: {
    label: 'Tipo de orden',
    MARKET: 'Mercado',
    LIMIT: 'Límite',
  },
  fields: {
    quantity: 'Cantidad (acciones)',
    amount: 'Monto (ARS)',
    limitPrice: 'Precio límite',
    estimatedTotal: 'Total estimado',
    availableCash: 'Efectivo disponible',
    availableShares: 'Acciones disponibles',
  },
  hints: {
    amount: 'Las acciones se calculan con el último precio.',
    amountLimit:
      'Las acciones se calculan con el último precio, por eso el total estimado a tu precio límite puede ser distinto.',
    limit: 'El total estimado usa el precio límite.',
  },
  actions: {
    cancel: 'Cancelar',
    submitBuy: 'Comprar',
    submitSell: 'Vender',
    submitting: 'Enviando...',
    newOrder: 'Nueva orden',
    close: 'Cerrar',
  },
  result: {
    title: 'Resultado de la orden',
    filled: 'La orden se ejecutó correctamente.',
    pending: 'La orden fue enviada y está pendiente de ejecución.',
    rejected: 'La orden fue rechazada.',
    orderId: 'Orden #{{id}}',
    details: 'Detalle',
  },
  status: {
    PENDING: 'Pendiente',
    FILLED: 'Ejecutada',
    REJECTED: 'Rechazada',
  },
  errors: {
    instrumentNotFound: 'Este instrumento ya no está disponible.',
    session: 'Tu sesión no está disponible. Recargá la página.',
    unknown: 'No se pudo completar la orden.',
    lastPriceUnavailable: 'El último precio no está disponible. Intentá más tarde.',
  },
} satisfies typeof enOrders
