import { describe, expect, it } from 'vitest'
import { i18n } from '.'
import {
  changeLanguage,
  getIntlLocale,
  isAppLocale,
  persistLanguage,
  resolveInitialLanguage,
} from './language'
import { LANGUAGE_STORAGE_KEY } from './types'

describe('resolveInitialLanguage', () => {
  it('prefers a stored choice over the browser language', () => {
    expect(resolveInitialLanguage({ stored: 'en', navigatorLanguages: ['es-AR'] })).toBe('en')
  })

  it('maps es-AR to es', () => {
    expect(resolveInitialLanguage({ stored: null, navigatorLanguages: ['es-AR'] })).toBe('es')
  })

  it('maps en-US to en', () => {
    expect(resolveInitialLanguage({ stored: null, navigatorLanguages: ['en-US'] })).toBe('en')
  })

  it('uses the first supported browser language', () => {
    expect(resolveInitialLanguage({ stored: null, navigatorLanguages: ['fr-FR', 'en-US'] })).toBe(
      'en',
    )
  })

  it('falls back to es for an unsupported browser language', () => {
    expect(resolveInitialLanguage({ stored: null, navigatorLanguages: ['fr-FR'] })).toBe('es')
  })

  it('falls back to es without data', () => {
    expect(resolveInitialLanguage({ stored: null, navigatorLanguages: [] })).toBe('es')
  })

  it('ignores an invalid stored value', () => {
    expect(resolveInitialLanguage({ stored: 'fr', navigatorLanguages: ['en-US'] })).toBe('en')
  })

  it('reads localStorage when no stored value is passed', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en')
    expect(resolveInitialLanguage({ navigatorLanguages: ['es-AR'] })).toBe('en')
  })
})

describe('locale helpers', () => {
  it('recognizes supported locales', () => {
    expect(isAppLocale('en')).toBe(true)
    expect(isAppLocale('es')).toBe(true)
    expect(isAppLocale('es-AR')).toBe(false)
    expect(isAppLocale(undefined)).toBe(false)
  })

  it('maps app locales to Intl locales', () => {
    expect(getIntlLocale('en')).toBe('en-US')
    expect(getIntlLocale('es')).toBe('es-AR')
  })

  it('persists a language', () => {
    persistLanguage('es')
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('es')
  })
})

describe('changeLanguage', () => {
  it('switches i18n, persists the choice and updates <html lang>', async () => {
    await changeLanguage('es')

    expect(i18n.language).toBe('es')
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('es')
    expect(document.documentElement.lang).toBe('es')
  })
})
