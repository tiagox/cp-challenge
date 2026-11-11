import { useTranslation } from 'react-i18next'

export default function App() {
  const { t } = useTranslation()

  return (
    <main>
      <h1>{t('common.appName')}</h1>
      <p>{t('common.comingSoon')}</p>
    </main>
  )
}
