import i18n from 'i18next'
import { LANGUAGE_STORAGE_KEY, SUPPORTED_LOCALES, type AppLocale } from './types'

const FALLBACK_LOCALE: AppLocale = 'es'

const INTL_LOCALES: Record<AppLocale, 'en-US' | 'es-AR'> = {
  en: 'en-US',
  es: 'es-AR',
}

export function isAppLocale(value: unknown): value is AppLocale {
  return SUPPORTED_LOCALES.some((locale) => locale === value)
}

export function getIntlLocale(locale: AppLocale): 'en-US' | 'es-AR' {
  return INTL_LOCALES[locale]
}

function readStoredLanguage(): string | null {
  try {
    return globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY) ?? null
  } catch {
    return null
  }
}

function browserLanguages(): readonly string[] {
  if (typeof navigator === 'undefined') return []
  if (navigator.languages?.length) return navigator.languages
  return navigator.language ? [navigator.language] : []
}

/**
 * Stored choice → first browser language starting with `es` or `en` → `es`.
 * Keep in sync with the boot script in `index.html`.
 */
export function resolveInitialLanguage(
  options: {
    stored?: string | null
    navigatorLanguages?: readonly string[]
  } = {},
): AppLocale {
  const stored = 'stored' in options ? options.stored : readStoredLanguage()
  if (isAppLocale(stored)) return stored

  const languages = options.navigatorLanguages ?? browserLanguages()
  for (const language of languages) {
    const prefix = language.toLowerCase().slice(0, 2)
    if (isAppLocale(prefix)) return prefix
  }

  return FALLBACK_LOCALE
}

export function persistLanguage(locale: AppLocale): void {
  try {
    globalThis.localStorage?.setItem(LANGUAGE_STORAGE_KEY, locale)
  } catch {
    // Storage can be unavailable (private mode, quota); the choice lasts for this session.
  }
}

/** Explicit user switch: the only path that persists the language. */
export async function changeLanguage(locale: AppLocale): Promise<void> {
  await i18n.changeLanguage(locale)
  persistLanguage(locale)
  document.documentElement.lang = locale
}
