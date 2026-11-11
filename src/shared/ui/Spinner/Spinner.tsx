import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cx } from '@/shared/lib/cx'
import { VisuallyHidden } from '../VisuallyHidden'
import styles from './Spinner.module.scss'

interface SpinnerProps {
  label?: string
  size?: 'sm' | 'md'
  className?: string
}

export function Spinner({ label, size = 'md', className }: SpinnerProps) {
  const { t } = useTranslation()

  return (
    <span role="status" className={cx(styles.spinner, styles[size], className)}>
      <LoaderCircle className={styles.icon} aria-hidden="true" />
      <VisuallyHidden>{label ?? t('common.loading')}</VisuallyHidden>
    </span>
  )
}
