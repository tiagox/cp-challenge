import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveInitialTheme, THEME_STORAGE_KEY } from '@/app/theme/theme'
import { ThemeToggle } from '@/app/layout/ThemeToggle'
import { resolveInitialLanguage } from '@/shared/i18n/language'
import indexHtml from '../../index.html?raw'
import { renderWithProviders } from './render'

type ChangeListener = (event: MediaQueryListEvent) => void

/** jsdom has no `matchMedia`; this stub lets tests flip `prefers-color-scheme`. */
function stubPrefersDark(initial: boolean) {
  let matches = initial
  const listeners = new Set<ChangeListener>()
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      get matches() {
        return query === '(prefers-color-scheme: dark)' && matches
      },
      media: query,
      addEventListener: (_type: string, listener: ChangeListener) => listeners.add(listener),
      removeEventListener: (_type: string, listener: ChangeListener) => listeners.delete(listener),
    })),
  )
  return {
    set(value: boolean) {
      matches = value
      for (const listener of listeners) listener({ matches } as MediaQueryListEvent)
    },
  }
}

function runBootScript() {
  const script = /<script>([\s\S]*?)<\/script>/.exec(indexHtml)?.[1]
  if (!script) throw new Error('Boot script not found in index.html')
  new Function(script)()
}

beforeEach(() => {
  delete document.documentElement.dataset.theme
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('resolveInitialTheme', () => {
  it('prefers a valid stored theme over the system preference', () => {
    expect(resolveInitialTheme({ stored: 'light', prefersDark: true })).toBe('light')
    expect(resolveInitialTheme({ stored: 'dark', prefersDark: false })).toBe('dark')
  })

  it('follows the system preference without a valid stored theme', () => {
    expect(resolveInitialTheme({ stored: null, prefersDark: true })).toBe('dark')
    expect(resolveInitialTheme({ stored: 'purple', prefersDark: true })).toBe('dark')
  })

  it('falls back to light', () => {
    expect(resolveInitialTheme({ stored: null, prefersDark: false })).toBe('light')
  })
})

describe('boot script', () => {
  const cases = [
    { stored: null, prefersDark: false },
    { stored: null, prefersDark: true },
    { stored: 'dark', prefersDark: false },
    { stored: 'light', prefersDark: true },
    { stored: 'bogus', prefersDark: true },
  ] as const

  it.each(cases)('resolves the theme like the provider (%o)', ({ stored, prefersDark }) => {
    stubPrefersDark(prefersDark)
    if (stored) localStorage.setItem(THEME_STORAGE_KEY, stored)

    runBootScript()

    expect(document.documentElement.dataset.theme).toBe(
      resolveInitialTheme({ stored, prefersDark }),
    )
  })

  const languageCases = [
    { stored: null, languages: ['en-US', 'es-AR'] },
    { stored: null, languages: ['fr-FR', 'es-MX'] },
    { stored: null, languages: ['fr-FR', 'de-DE'] },
    { stored: 'en', languages: ['es-AR'] },
    { stored: 'xx', languages: ['EN-GB'] },
  ] as const

  it.each(languageCases)('resolves the language like i18n (%o)', ({ stored, languages }) => {
    // The boot script reads matchMedia before the language; jsdom has none.
    stubPrefersDark(false)
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue([...languages])
    if (stored) localStorage.setItem('cp.lang', stored)

    runBootScript()

    expect(document.documentElement.lang).toBe(
      resolveInitialLanguage({ stored, navigatorLanguages: languages }),
    )
  })
})

describe('ThemeProvider and ThemeToggle', () => {
  it('applies data-theme on render (light without stored theme or dark preference)', () => {
    renderWithProviders(<ThemeToggle />)

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument()
  })

  it('follows a dark system preference when nothing is stored', () => {
    stubPrefersDark(true)
    renderWithProviders(<ThemeToggle />)

    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('lets a stored theme win over the system preference', () => {
    stubPrefersDark(true)
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    renderWithProviders(<ThemeToggle />)

    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('toggles, updates data-theme and persists the explicit choice', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }))

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Switch to light theme' }))

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('tracks system changes until the user chooses, then stops', async () => {
    const user = userEvent.setup()
    const media = stubPrefersDark(false)
    renderWithProviders(<ThemeToggle />)

    act(() => media.set(true))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Switch to light theme' }))
    act(() => media.set(false))
    act(() => media.set(true))

    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('labels the toggle in Spanish', () => {
    renderWithProviders(<ThemeToggle />, { lang: 'es' })

    expect(screen.getByRole('button', { name: 'Cambiar a tema oscuro' })).toBeInTheDocument()
  })
})
