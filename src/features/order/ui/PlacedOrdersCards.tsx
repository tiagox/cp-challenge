import { useTranslation } from 'react-i18next'
import { orderTotal } from '@/entities/order/model/metrics'
import { useFormat } from '@/shared/i18n/useFormat'
import { Card } from '@/shared/ui/Card'
import { MoneyText } from '@/shared/ui/MoneyText'
import { OrderStatusBadge } from './OrderStatusBadge'
import styles from './PlacedOrdersCards.module.scss'
import type { PlacedOrdersProps } from './PlacedOrdersTable'

/** Mobile list (< 768px); hidden above by CSS. */
export function PlacedOrdersCards({ orders, tickers }: PlacedOrdersProps) {
  const { t } = useTranslation()
  const { quantity, dateTime } = useFormat()

  return (
    <ul className={styles.list}>
      {orders.map((order) => (
        <li key={order.id}>
          <Card as="article" className={styles.card}>
            {/* Not an <h3>: position cards use <h3> tickers on the same page. */}
            <div className={styles.header}>
              <strong className={styles.ticker}>
                {tickers.get(order.instrument_id) ??
                  t('orders.history.unknownInstrument', { id: order.instrument_id })}
              </strong>
              <OrderStatusBadge status={order.status} />
            </div>
            <dl className={styles.metrics}>
              <div className={styles.wide}>
                <dt>{t('orders.history.columns.date')}</dt>
                <dd>
                  <time dateTime={order.created_at}>
                    {dateTime(order.created_at) ?? t('common.notAvailable')}
                  </time>
                </dd>
              </div>
              <div>
                <dt>{t('orders.history.columns.side')}</dt>
                <dd>{t(`orders.side.${order.side}`)}</dd>
              </div>
              <div>
                <dt>{t('orders.history.columns.type')}</dt>
                <dd>{t(`orders.type.${order.type}`)}</dd>
              </div>
              <div>
                <dt>{t('orders.history.columns.quantity')}</dt>
                <dd>{quantity(order.quantity) ?? t('common.notAvailable')}</dd>
              </div>
              <div>
                <dt>{t('orders.history.columns.price')}</dt>
                <dd>
                  <MoneyText value={order.price} />
                </dd>
              </div>
              <div className={styles.wide}>
                <dt>{t('orders.history.columns.total')}</dt>
                <dd>
                  <MoneyText value={orderTotal(order)} />
                </dd>
              </div>
            </dl>
          </Card>
        </li>
      ))}
    </ul>
  )
}
