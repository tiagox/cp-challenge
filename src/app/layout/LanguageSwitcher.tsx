import { useTranslation } from 'react-i18next'
import { changeLanguage, isAppLocale } from '@/shared/i18n/language'
import type { AppLocale } from '@/shared/i18n/types'
import { SegmentedControl, type SegmentedOption } from '@/shared/ui/SegmentedControl'

// Language names are shown as codes in every language, so they are not translated.
const OPTIONS: ReadonlyArray<SegmentedOption<AppLocale>> = [
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' },
]

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const value: AppLocale = isAppLocale(i18n.language) ? i18n.language : 'es'

  return (
    <SegmentedControl
      label={t('nav.language')}
      name="language"
      value={value}
      options={OPTIONS}
      onChange={(locale) => void changeLanguage(locale)}
    />
  )
}
