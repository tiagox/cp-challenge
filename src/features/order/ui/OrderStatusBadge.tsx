import { useTranslation } from 'react-i18next'
import type { OrderStatus } from '@/shared/api/types'
import { Badge, type BadgeVariant } from '@/shared/ui/Badge'
import styles from './OrderStatusBadge.module.scss'

const variants: Record<OrderStatus, BadgeVariant> = {
  FILLED: 'positive',
  PENDING: 'warning',
  REJECTED: 'negative',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation()

  return (
    <Badge variant={variants[status]}>
      {t(`orders.status.${status}`)}
      <span className={styles.code}>{status}</span>
    </Badge>
  )
}
