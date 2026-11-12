import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Holding } from '@/entities/position/model/types'
import type { CreateOrderRequest, OrderSide } from '@/shared/api/types'
import { Button } from '@/shared/ui/Button'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Modal } from '@/shared/ui/Modal'
import { Spinner } from '@/shared/ui/Spinner'
import { useCreateOrder } from '../mutations'
import type { OrderInstrument } from '../model/OrderTicketContext'
import { OrderForm } from './OrderForm'
import styles from './OrderModal.module.scss'
import { OrderResult } from './OrderResult'

export interface OrderModalProps {
  instrument: OrderInstrument
  initialSide: OrderSide
  initialQuantity?: number
  cash: number | undefined
  holdings: Holding[] | undefined
  portfolioStatus: 'pending' | 'error' | 'success'
  onRetryPortfolio: () => void
  onClose: () => void
}

export function OrderModal({
  instrument,
  initialSide,
  initialQuantity,
  cash,
  holdings,
  portfolioStatus,
  onRetryPortfolio,
  onClose,
}: OrderModalProps) {
  const { t } = useTranslation()
  const formId = useId()
  const [side, setSide] = useState(initialSide)
  const mutation = useCreateOrder()

  const availableShares =
    holdings?.find((holding) => holding.instrument_id === instrument.id)?.quantity ?? 0

  const submit = (payload: CreateOrderRequest) => {
    if (!mutation.isPending) mutation.mutate(payload)
  }

  const closeButton = (
    <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
      {t(mutation.isIdle || mutation.isPending ? 'orders.actions.cancel' : 'orders.actions.close')}
    </Button>
  )

  // The result wins over portfolio state: the refetch it triggers may fail without hiding it.
  let body
  let result
  let footer = closeButton
  if (mutation.isSuccess || mutation.isError) {
    result = mutation.isSuccess ? (
      <OrderResult order={mutation.data} />
    ) : (
      <OrderResult error={mutation.error} />
    )
  } else if (cash !== undefined) {
    body = (
      <OrderForm
        id={formId}
        instrument={instrument}
        initialSide={initialSide}
        initialQuantity={initialQuantity}
        cash={cash}
        availableShares={availableShares}
        onSubmit={submit}
        onSideChange={setSide}
      />
    )
    footer = (
      <>
        {closeButton}
        <Button
          type="submit"
          form={formId}
          isLoading={mutation.isPending}
          disabled={!(instrument.last_price > 0)}
        >
          {t(
            mutation.isPending
              ? 'orders.actions.submitting'
              : side === 'BUY'
                ? 'orders.actions.submitBuy'
                : 'orders.actions.submitSell',
          )}
        </Button>
      </>
    )
  } else if (portfolioStatus === 'error') {
    body = <ErrorState onRetry={onRetryPortfolio} />
  } else {
    body = (
      <div className={styles.loading}>
        <Spinner />
      </div>
    )
  }

  return (
    <Modal
      open
      // Esc, overlay click and the header X all land here; none may close mid-request.
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose()
      }}
      title={t(side === 'BUY' ? 'orders.title.buy' : 'orders.title.sell', {
        ticker: instrument.ticker,
      })}
      description={t('orders.description')}
      footer={footer}
    >
      {body}
      {/* Always mounted: screen readers only announce changes inside an existing live region. */}
      <div aria-live="polite">{result}</div>
    </Modal>
  )
}
