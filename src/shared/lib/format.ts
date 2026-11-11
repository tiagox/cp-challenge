import { getIntlLocale } from '@/shared/i18n/language'
import type { AppLocale } from '@/shared/i18n/types'
import { isFiniteNumber } from './math'

const CURRENCY = 'ARS'

export function formatCurrency(
  value: number | null | undefined,
  locale: AppLocale,
  options: { signed?: boolean } = {},
): string | null {
  if (!isFiniteNumber(value)) return null
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: 'currency',
    currency: CURRENCY,
    // EN shows the ISO code (`ARS 1,234.56`); ES shows the local symbol (`$ 1.234,56`).
    currencyDisplay: locale === 'en' ? 'code' : 'symbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: options.signed ? 'always' : 'auto',
  }).format(value)
}

/** `value` is already a percentage (12.34 → `12.34%`). */
export function formatPercent(
  value: number | null | undefined,
  locale: AppLocale,
  options: { signed?: boolean } = {},
): string | null {
  if (!isFiniteNumber(value)) return null
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: options.signed ? 'always' : 'auto',
  }).format(value / 100)
}

export function formatQuantity(value: number | null | undefined, locale: AppLocale): string | null {
  if (!isFiniteNumber(value)) return null
  return new Intl.NumberFormat(getIntlLocale(locale), { maximumFractionDigits: 0 }).format(value)
}
