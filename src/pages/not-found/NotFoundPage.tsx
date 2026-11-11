import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/shared/ui/PageHeader'
import styles from './NotFoundPage.module.scss'

export default function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <>
      <PageHeader title={t('common.notFoundTitle')} description={t('common.notFoundDescription')} />
      <Link to="/instruments" className={styles.link}>
        <ArrowLeft aria-hidden="true" />
        {t('common.goToInstruments')}
      </Link>
    </>
  )
}
