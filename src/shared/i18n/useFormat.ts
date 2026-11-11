import { useTranslation } from 'react-i18next'
import { formatCurrency, formatPercent, formatQuantity } from '@/shared/lib/format'
import { isAppLocale } from './language'
import type { AppLocale } from './types'

export function useFormat(): {
  locale: AppLocale
  currency: (value: number | null | undefined, options?: { signed?: boolean }) => string | null
  percent: (value: number | null | undefined, options?: { signed?: boolean }) => string | null
  quantity: (value: number | null | undefined) => string | null
} {
  // Subscribing through useTranslation re-renders consumers when the language changes.
  const { i18n } = useTranslation()
  const locale: AppLocale = isAppLocale(i18n.language) ? i18n.language : 'es'

  return {
    locale,
    currency: (value, options) => formatCurrency(value, locale, options),
    percent: (value, options) => formatPercent(value, locale, options),
    quantity: (value) => formatQuantity(value, locale),
  }
}
