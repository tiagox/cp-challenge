export const orders = {
  title: {
    buy: 'Buy {{ticker}}',
    sell: 'Sell {{ticker}}',
  },
  description: 'Place a market or limit order.',
  side: {
    label: 'Side',
    BUY: 'Buy',
    SELL: 'Sell',
  },
  type: {
    label: 'Order type',
    MARKET: 'Market',
    LIMIT: 'Limit',
  },
  fields: {
    quantity: 'Quantity (shares)',
    amount: 'Amount (ARS)',
    limitPrice: 'Limit price',
    estimatedTotal: 'Estimated total',
    availableCash: 'Available cash',
    availableShares: 'Available shares',
  },
  hints: {
    amount: 'Whole shares are calculated using the last price.',
    amountLimit:
      'Whole shares are calculated using the last price, so the estimated total at your limit price may differ.',
    limit: 'The estimated total uses the limit price.',
  },
  actions: {
    cancel: 'Cancel',
    submitBuy: 'Buy',
    submitSell: 'Sell',
    submitting: 'Submitting...',
    newOrder: 'New order',
    close: 'Close',
  },
  result: {
    title: 'Order result',
    filled: 'Order filled successfully.',
    pending: 'Order submitted. It is pending execution.',
    rejected: 'Order rejected.',
    orderId: 'Order #{{id}}',
    details: 'Details',
  },
  status: {
    PENDING: 'Pending',
    FILLED: 'Filled',
    REJECTED: 'Rejected',
  },
  errors: {
    instrumentNotFound: 'This instrument is no longer available.',
    session: 'Your session is not available. Reload the page.',
    unknown: 'The order could not be completed.',
    lastPriceUnavailable: 'The last price is unavailable. Try again later.',
  },
}
