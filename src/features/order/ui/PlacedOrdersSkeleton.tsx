import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/shared/ui/Skeleton'
import { VisuallyHidden } from '@/shared/ui/VisuallyHidden'
import styles from './PlacedOrdersSkeleton.module.scss'

const ITEMS = [0, 1, 2]

/** Placeholder sized like the table (desktop) and cards (mobile). */
export function PlacedOrdersSkeleton() {
  const { t } = useTranslation()

  return (
    <div role="status">
      <VisuallyHidden>{t('common.loading')}</VisuallyHidden>
      <div className={styles.table}>
        {ITEMS.map((row) => (
          <div key={row} className={styles.row}>
            <Skeleton width="18%" />
            <Skeleton width="10%" />
            <Skeleton width="10%" />
            <Skeleton width="15%" />
            <Skeleton width="15%" />
            <Skeleton width="12%" />
          </div>
        ))}
      </div>
      <div className={styles.cards}>
        {ITEMS.map((card) => (
          <div key={card} className={styles.card}>
            <Skeleton width="30%" />
            <Skeleton width="80%" />
            <Skeleton width="80%" />
          </div>
        ))}
      </div>
    </div>
  )
}
