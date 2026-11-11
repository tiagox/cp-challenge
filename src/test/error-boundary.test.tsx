import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderApp } from './render'

vi.mock('@/pages/portfolio/PortfolioPage', () => ({
  default: () => {
    throw new Error('boom')
  },
}))

beforeEach(() => {
  // React and React Router log caught render errors; keep the test output clean.
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('route errors', () => {
  it('shows the translated error screen with a retry button', async () => {
    renderApp({ route: '/portfolio' })

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    expect(screen.queryByText('Unexpected Application Error!')).not.toBeInTheDocument()
  })

  it('shows the error screen in Spanish', async () => {
    renderApp({ route: '/portfolio', lang: 'es' })

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Algo salió mal' }),
    ).toBeInTheDocument()
  })
})
