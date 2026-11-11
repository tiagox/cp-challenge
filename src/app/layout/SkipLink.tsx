import { useTranslation } from 'react-i18next'
import styles from './SkipLink.module.scss'

export function SkipLink() {
  const { t } = useTranslation()

  return (
    <a className={styles.skipLink} href="#main">
      {t('nav.skipToContent')}
    </a>
  )
}
