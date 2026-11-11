import { RotateCw, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cx } from '@/shared/lib/cx'
import { Button } from '../Button'
import styles from './ErrorState.module.scss'

export interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel,
  className,
}: ErrorStateProps) {
  const { t } = useTranslation()

  return (
    <div className={cx(styles.state, className)} role="alert">
      <span className={styles.icon} aria-hidden="true">
        <TriangleAlert />
      </span>
      <h2 className={styles.title}>{title ?? t('common.unexpectedErrorTitle')}</h2>
      <p className={styles.description}>{description ?? t('common.unexpectedErrorDescription')}</p>
      {onRetry ? (
        <Button variant="secondary" leftIcon={<RotateCw />} onClick={onRetry}>
          {retryLabel ?? t('common.retry')}
        </Button>
      ) : null}
    </div>
  )
}
