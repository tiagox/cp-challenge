import type { instruments as enInstruments } from '../en/instruments'

export const instruments = {
  title: 'Instrumentos',
  description: 'Explorá los instrumentos disponibles y enviá una orden de mercado o límite.',
  count_one: '{{count}} instrumento',
  count_other: '{{count}} instrumentos',
  columns: {
    ticker: 'Ticker',
    name: 'Nombre',
    lastPrice: 'Último precio',
    return: 'Retorno',
    action: 'Acción',
  },
  type: {
    ACCIONES: 'Acciones',
    MONEDA: 'Moneda',
  },
  actions: {
    trade: 'Operar',
  },
  empty: {
    title: 'No hay instrumentos disponibles',
    description: 'Intentá de nuevo más tarde.',
  },
} satisfies typeof enInstruments
