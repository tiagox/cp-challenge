import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { THEME_STORAGE_KEY } from '@/app/theme/theme'
import { API_BASE_URL, CANDIDATE_STORAGE_KEY, resolveCandidateId } from '@/shared/api/config'
import { resolveInitialLanguage } from '@/shared/i18n/language'
import { runBootScript, stubPrefersDark } from './helpers'
import { renderApp } from './render'
import { server } from './server'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  delete document.documentElement.dataset.theme
})

describe('persistence', () => {
  it('keeps an explicit language and theme across a remount', async () => {
    const first = renderApp({ route: '/instruments' })
    await screen.findByRole('heading', { level: 1, name: 'Instruments' })

    await userEvent.click(screen.getByRole('radio', { name: 'ES' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar a tema oscuro' }))
    expect(localStorage.getItem('cp.lang')).toBe('es')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    first.unmount()
    delete document.documentElement.dataset.theme

    // A reload boots from storage: the boot script and i18n resolve the stored values.
    runBootScript()
    renderApp({ route: '/instruments', lang: resolveInitialLanguage() })

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Instrumentos' }),
    ).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('es')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('lets stored values win over browser language and system theme on boot', () => {
    stubPrefersDark(true)
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US'])
    localStorage.setItem('cp.lang', 'es')
    localStorage.setItem(THEME_STORAGE_KEY, 'light')

    runBootScript()

    expect(document.documentElement.lang).toBe('es')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(resolveInitialLanguage()).toBe('es')
  })

  it('creates the candidate once, reuses it, and never renders it', async () => {
    const first = resolveCandidateId({ envValue: '' })
    expect(localStorage.getItem(CANDIDATE_STORAGE_KEY)).toBe(first)
    expect(resolveCandidateId({ envValue: '' })).toBe(first)

    const sent: (string | null)[] = []
    server.use(
      http.get(`${API_BASE_URL}/portfolio`, ({ request }) => {
        sent.push(request.headers.get('X-Candidate-Id'))
      }),
    )
    renderApp({ route: '/portfolio' })
    await screen.findByRole('table', { name: 'Positions' })

    expect(sent.length).toBeGreaterThan(0)
    expect(sent.every((id) => id && id.length > 0)).toBe(true)
    for (const id of sent) expect(document.body.textContent).not.toContain(id)
  })

  it('prefers VITE_CANDIDATE_ID over localStorage', () => {
    localStorage.setItem(CANDIDATE_STORAGE_KEY, 'stored')

    expect(resolveCandidateId({ envValue: 'pinned' })).toBe('pinned')
  })
})
