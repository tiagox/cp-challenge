import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/shared/ui/Skeleton'
import { VisuallyHidden } from '@/shared/ui/VisuallyHidden'
import styles from './PortfolioSkeleton.module.scss'
// Same grid as the real summary, so the cards don't jump when data arrives.
import summaryStyles from './PortfolioSummary.module.scss'

const ITEMS = [0, 1, 2, 3]

/** Placeholder sized like the summary, table (desktop) and cards (mobile) to avoid a layout jump. */
export function PortfolioSkeleton() {
  const { t } = useTranslation()

  return (
    <div role="status">
      <VisuallyHidden>{t('common.loading')}</VisuallyHidden>
      <div className={summaryStyles.grid}>
        {ITEMS.map((item) => (
          <div key={item} className={styles.summaryCard}>
            <Skeleton width="50%" />
            <Skeleton width="70%" height={28} />
          </div>
        ))}
      </div>
      <Skeleton width={160} height={28} className={styles.heading} />
      <div className={styles.table}>
        {ITEMS.map((row) => (
          <div key={row} className={styles.row}>
            <Skeleton width="15%" />
            <Skeleton width="10%" />
            <Skeleton width="15%" />
            <Skeleton width="15%" />
            <Skeleton width="10%" />
          </div>
        ))}
      </div>
      <div className={styles.cards}>
        {ITEMS.map((card) => (
          <div key={card} className={styles.card}>
            <Skeleton width="30%" />
            <Skeleton width="80%" />
            <Skeleton width="80%" />
            <Skeleton variant="rect" height={44} />
          </div>
        ))}
      </div>
    </div>
  )
}
