import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from '@/app/providers/ErrorBoundary'
import { renderApp, renderWithProviders } from './render'

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

describe('ErrorBoundary', () => {
  let shouldThrow = true
  function Flaky() {
    if (shouldThrow) throw new Error('boom')
    return <p>Recovered</p>
  }

  it('catches a render error, shows the fallback and recovers on retry', async () => {
    shouldThrow = true
    renderWithProviders(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
    expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeVisible()

    shouldThrow = false
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(screen.getByText('Recovered')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
