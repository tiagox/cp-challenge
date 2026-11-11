import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/shared/ui/Skeleton'
import { VisuallyHidden } from '@/shared/ui/VisuallyHidden'
import styles from './InstrumentsSkeleton.module.scss'

const ROWS = Array.from({ length: 6 }, (_, index) => index)
const CARDS = ROWS.slice(0, 4)

/** Placeholder sized like the table (desktop) and cards (mobile) to avoid a layout jump. */
export function InstrumentsSkeleton() {
  const { t } = useTranslation()

  return (
    <div role="status">
      <VisuallyHidden>{t('common.loading')}</VisuallyHidden>
      <div className={styles.table}>
        {ROWS.map((row) => (
          <div key={row} className={styles.row}>
            <Skeleton width="20%" />
            <Skeleton width="35%" />
            <Skeleton width="15%" />
            <Skeleton width="10%" />
          </div>
        ))}
      </div>
      <div className={styles.cards}>
        {CARDS.map((card) => (
          <div key={card} className={styles.card}>
            <Skeleton width="40%" />
            <Skeleton width="60%" />
            <Skeleton variant="rect" height={44} />
          </div>
        ))}
      </div>
    </div>
  )
}
