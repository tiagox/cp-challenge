import type { components } from './generated/schema'

type Schemas = components['schemas']

export type Instrument = Schemas['Instrument']
export type Holding = Schemas['Holding']
export type Portfolio = Schemas['Portfolio']
export type OrderSide = Schemas['OrderSide']
export type OrderType = Schemas['OrderType']
export type OrderStatus = Schemas['OrderStatus']
export type MarketOrderRequest = Schemas['MarketOrderRequest']
export type LimitOrderRequest = Schemas['LimitOrderRequest']
export type CreateOrderRequest = Schemas['CreateOrderRequest']
export type Order = Schemas['Order']
export type ApiErrorBody = Schemas['Error']
