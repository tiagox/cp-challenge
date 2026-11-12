import type { portfolio as enPortfolio } from '../en/portfolio'

export const portfolio = {
  title: 'Portafolio',
  description: 'Seguí tus posiciones y su rendimiento.',
  summary: {
    cash: 'Efectivo disponible',
    marketValue: 'Valor de mercado',
    profitLoss: 'Ganancia total',
    return: 'Rendimiento total',
  },
  positions: {
    title: 'Posiciones',
    count_one: '{{count}} posición',
    count_other: '{{count}} posiciones',
  },
  columns: {
    ticker: 'Ticker',
    quantity: 'Cantidad',
    marketValue: 'Valor de mercado',
    profitLoss: 'Ganancia',
    return: 'Rendimiento',
    action: 'Acción',
  },
  actions: {
    sell: 'Vender',
    sellTicker: 'Vender {{ticker}}',
  },
  empty: {
    title: 'Todavía no tenés posiciones',
    description: 'Comprá tu primer instrumento para empezar a construir tu portafolio.',
    action: 'Ver instrumentos',
  },
} satisfies typeof enPortfolio
