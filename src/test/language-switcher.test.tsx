import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from './render'

describe('LanguageSwitcher', () => {
  it('switches visible copy to ES and back to EN, persisting each choice', async () => {
    const user = userEvent.setup()
    renderApp({ route: '/instruments' })
    await screen.findByRole('heading', { level: 1, name: 'Instruments' })

    const group = screen.getByRole('group', { name: 'Language' })
    expect(screen.getByRole('radio', { name: 'EN' })).toBeChecked()
    expect(group).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'ES' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Instrumentos' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Idioma' })).toBeInTheDocument()
    expect(localStorage.getItem('cp.lang')).toBe('es')
    expect(document.documentElement.lang).toBe('es')
    // Option labels are codes and stay the same in every language.
    expect(screen.getByRole('radio', { name: 'ES' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'EN' })).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'EN' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Instruments' }),
    ).toBeInTheDocument()
    expect(localStorage.getItem('cp.lang')).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })

  it('starts on ES when rendered in Spanish', async () => {
    renderApp({ route: '/instruments', lang: 'es' })
    await screen.findByRole('heading', { level: 1, name: 'Instrumentos' })

    expect(screen.getByRole('radio', { name: 'ES' })).toBeChecked()
  })
})
