export const instruments = {
  title: 'Instruments',
  description: 'Browse available instruments and place a market or limit order.',
  count_one: '{{count}} instrument',
  count_other: '{{count}} instruments',
  columns: {
    ticker: 'Ticker',
    name: 'Name',
    lastPrice: 'Last price',
    return: 'Return',
    action: 'Action',
  },
  type: {
    ACCIONES: 'Stocks',
    MONEDA: 'Currency',
  },
  actions: {
    trade: 'Trade',
  },
  empty: {
    title: 'No instruments available',
    description: 'Please try again later.',
  },
}
