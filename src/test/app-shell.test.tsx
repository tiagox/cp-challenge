import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from './render'

function desktopNav() {
  return screen.getAllByRole('navigation', { name: 'Main navigation' })[0]!
}

describe('app shell', () => {
  it('redirects / to /instruments', async () => {
    renderApp({ route: '/' })

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Instruments' }),
    ).toBeInTheDocument()
  })

  it('renders the instruments page', async () => {
    renderApp({ route: '/instruments' })

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Instruments' }),
    ).toBeInTheDocument()
    expect(await screen.findByRole('table', { name: 'Instruments' })).toBeInTheDocument()
  })

  it('renders the portfolio stub', async () => {
    renderApp({ route: '/portfolio' })

    expect(await screen.findByRole('heading', { level: 1, name: 'Portfolio' })).toBeInTheDocument()
  })

  it('renders not-found for /search, which is not a route', async () => {
    renderApp({ route: '/search' })

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument()
  })

  it('renders not-found copy and a link back to instruments for unknown routes', async () => {
    renderApp({ route: '/nope/really' })

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument()
    expect(screen.getByText('The page you are looking for does not exist.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to instruments' })).toHaveAttribute(
      'href',
      '/instruments',
    )
  })

  it('marks the active route in both navs', async () => {
    renderApp({ route: '/portfolio' })
    await screen.findByRole('heading', { level: 1, name: 'Portfolio' })

    const navs = screen.getAllByRole('navigation', { name: 'Main navigation' })
    expect(navs).toHaveLength(2)
    for (const nav of navs) {
      expect(within(nav).getByRole('link', { name: 'Portfolio' })).toHaveAttribute(
        'aria-current',
        'page',
      )
      expect(within(nav).getByRole('link', { name: 'Instruments' })).not.toHaveAttribute(
        'aria-current',
      )
    }
  })

  it('renders the brand and nav in Spanish', async () => {
    renderApp({ route: '/instruments', lang: 'es' })

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Instrumentos' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'CP Invest' })).toHaveAttribute('href', '/instruments')
    expect(
      within(screen.getAllByRole('navigation', { name: 'Navegación principal' })[0]!).getByRole(
        'link',
        { name: 'Portafolio' },
      ),
    ).toBeInTheDocument()
  })

  it('has a skip link to #main as the first focusable element', async () => {
    renderApp({ route: '/instruments' })
    await screen.findByRole('heading', { level: 1, name: 'Instruments' })

    const skipLink = screen.getByRole('link', { name: 'Skip to content' })
    expect(skipLink).toHaveAttribute('href', '#main')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main')
    expect(desktopNav()).toBeInTheDocument()

    const firstFocusable = document.querySelector('a[href], button, input, [tabindex="0"]')
    expect(firstFocusable).toBe(skipLink)
  })
})
