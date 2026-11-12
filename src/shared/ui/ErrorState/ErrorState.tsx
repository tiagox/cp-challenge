import { RotateCw, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { errorKey } from '@/shared/api/errors'
import { Button } from '../Button'
import styles from './ErrorState.module.scss'

export interface ErrorStateProps {
  /** The failed query's error; picks the network, timeout or server message. */
  error: unknown
  onRetry: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const { t } = useTranslation()

  return (
    <div className={styles.state} role="alert">
      <span className={styles.icon} aria-hidden="true">
        <TriangleAlert />
      </span>
      <h2 className={styles.title}>{t('errors.unexpected')}</h2>
      <p className={styles.description}>{t(errorKey(error))}</p>
      <Button variant="secondary" leftIcon={<RotateCw />} onClick={onRetry}>
        {t('common.retry')}
      </Button>
    </div>
  )
}
