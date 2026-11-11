import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/shared/ui/PageHeader'

// Stub: spec 05 replaces this page.
export default function PortfolioPage() {
  const { t } = useTranslation()

  return <PageHeader title={t('nav.portfolio')} description={t('common.comingSoon')} />
}
