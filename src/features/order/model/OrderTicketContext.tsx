import { createContext, use, useMemo, useReducer, type ReactNode } from 'react'
import type { OrderSide } from '@/shared/api/types'

export interface OrderInstrument {
  id: number
  ticker: string
  name?: string
  last_price: number
}

export interface OpenOrderTicketInput {
  instrument: OrderInstrument
  side?: OrderSide
  quantity?: number
}

export interface OrderTicketState {
  isOpen: boolean
  instrument: OrderInstrument | null
  presetSide: OrderSide
  presetQuantity?: number
}

export interface OrderTicketContextValue {
  state: OrderTicketState
  open: (input: OpenOrderTicketInput) => void
  close: () => void
}

type OrderTicketAction = { type: 'open'; input: OpenOrderTicketInput } | { type: 'close' }

const initialState: OrderTicketState = {
  isOpen: false,
  instrument: null,
  presetSide: 'BUY',
}

function orderTicketReducer(_state: OrderTicketState, action: OrderTicketAction): OrderTicketState {
  switch (action.type) {
    case 'open':
      return {
        isOpen: true,
        instrument: action.input.instrument,
        presetSide: action.input.side ?? 'BUY',
        presetQuantity: action.input.quantity,
      }
    case 'close':
      return initialState
  }
}

const OrderTicketContext = createContext<OrderTicketContextValue | null>(null)

export function OrderTicketProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(orderTicketReducer, initialState)

  const value = useMemo<OrderTicketContextValue>(
    () => ({
      state,
      open: (input) => dispatch({ type: 'open', input }),
      close: () => dispatch({ type: 'close' }),
    }),
    [state],
  )

  return <OrderTicketContext value={value}>{children}</OrderTicketContext>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook belongs with its provider
export function useOrderTicket(): OrderTicketContextValue {
  const context = use(OrderTicketContext)
  if (!context) throw new Error('useOrderTicket must be used within OrderTicketProvider')
  return context
}
