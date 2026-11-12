import { useTranslation } from 'react-i18next'
import { ApiError } from '@/shared/api/errors'
import type { Order } from '@/shared/api/types'
import { orderErrorMessageKey } from '../model/errorMapping'
import styles from './OrderResult.module.scss'
import { OrderStatusBadge } from './OrderStatusBadge'

const statusMessageKeys = {
  FILLED: 'orders.result.filled',
  PENDING: 'orders.result.pending',
  REJECTED: 'orders.result.rejected',
} as const

export type OrderResultProps = { order: Order; error?: never } | { order?: never; error: unknown }

export function OrderResult({ order, error }: OrderResultProps) {
  const { t } = useTranslation()
  const serverMessage = error instanceof ApiError ? error.serverMessage : undefined

  return (
    <div className={styles.result}>
      {order ? (
        <>
          <h3 className={styles.title}>{t('orders.result.title')}</h3>
          <p className={styles.id}>{t('orders.result.orderId', { id: order.id })}</p>
          <OrderStatusBadge status={order.status} />
          <p className={styles.message}>{t(statusMessageKeys[order.status])}</p>
        </>
      ) : (
        <>
          <h3 className={styles.title}>{t('orders.result.rejected')}</h3>
          <p className={styles.message}>{t(orderErrorMessageKey(error))}</p>
          {serverMessage ? (
            <details className={styles.details}>
              <summary>{t('orders.result.details')}</summary>
              <code>{serverMessage}</code>
            </details>
          ) : null}
        </>
      )}
    </div>
  )
}
