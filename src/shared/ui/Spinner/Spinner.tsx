import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cx } from '@/shared/lib/cx'
import { VisuallyHidden } from '../VisuallyHidden'
import styles from './Spinner.module.scss'

interface SpinnerProps {
  size?: 'sm' | 'md'
}

export function Spinner({ size = 'md' }: SpinnerProps) {
  const { t } = useTranslation()

  return (
    <span role="status" className={cx(styles.spinner, styles[size])}>
      <LoaderCircle className={styles.icon} aria-hidden="true" />
      <VisuallyHidden>{t('common.loading')}</VisuallyHidden>
    </span>
  )
}
