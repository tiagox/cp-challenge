import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { resolveInitialLanguage } from './language'
import { en } from './locales/en'
import { es } from './locales/es'
import { SUPPORTED_LOCALES } from './types'

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: resolveInitialLanguage(),
  fallbackLng: 'es',
  supportedLngs: [...SUPPORTED_LOCALES],
  interpolation: { escapeValue: false },
  returnNull: false,
  initAsync: false,
})

if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language
}

export { i18n }
