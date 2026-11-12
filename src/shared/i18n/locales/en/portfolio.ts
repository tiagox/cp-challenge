export const portfolio = {
  title: 'Portfolio',
  description: 'Track your positions and performance.',
  summary: {
    cash: 'Available cash',
    marketValue: 'Market value',
    profitLoss: 'Total P&L',
    return: 'Total return',
  },
  positions: {
    title: 'Positions',
    count_one: '{{count}} position',
    count_other: '{{count}} positions',
    /** Shown when a holding comes back without its ticker. */
    unknownInstrument: '#{{id}}',
  },
  columns: {
    ticker: 'Ticker',
    quantity: 'Quantity',
    marketValue: 'Market value',
    profitLoss: 'P&L',
    return: 'Return',
    action: 'Action',
  },
  actions: {
    sell: 'Sell',
    sellTicker: 'Sell {{ticker}}',
  },
  empty: {
    title: 'No positions yet',
    description: 'Buy your first instrument to start building your portfolio.',
    action: 'Browse instruments',
  },
}
