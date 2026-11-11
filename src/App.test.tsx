import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import App from './App'

describe('App placeholder', () => {
  it('renders the translated app name', () => {
    renderWithProviders(<App />)

    expect(screen.getByRole('heading', { name: 'Cocos Invest' })).toBeInTheDocument()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })

  it('renders Spanish copy', () => {
    renderWithProviders(<App />, { lang: 'es' })

    expect(screen.getByText('Próximamente')).toBeInTheDocument()
  })
})
