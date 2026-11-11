import type { Instrument } from '@/shared/api/types'

export const dyca = {
  id: 1,
  ticker: 'DYCA',
  name: 'Dycasa S.A.',
  type: 'ACCIONES',
  last_price: 50.07,
  close_price: 45.72,
} satisfies Instrument

export const capx = {
  id: 2,
  ticker: 'CAPX',
  name: 'Capex S.A.',
  type: 'ACCIONES',
  last_price: 49.71,
  close_price: 53.68,
} satisfies Instrument

/** `last_price: 0`: price unavailable. */
export const mirg = {
  id: 5,
  ticker: 'MIRG',
  name: 'Mirgor',
  type: 'ACCIONES',
  last_price: 0,
  close_price: 37.74,
} satisfies Instrument

export const ars = {
  id: 26,
  ticker: 'ARS',
  name: 'Pesos',
  type: 'MONEDA',
  last_price: 1,
  close_price: 1,
} satisfies Instrument

export const instrumentsFixture: Instrument[] = [dyca, capx, mirg, ars]
