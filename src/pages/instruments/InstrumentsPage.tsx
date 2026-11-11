import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/shared/ui/PageHeader'

// Stub: spec 03 replaces this page.
export default function InstrumentsPage() {
  const { t } = useTranslation()

  return <PageHeader title={t('nav.instruments')} description={t('common.comingSoon')} />
}
