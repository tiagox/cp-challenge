import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('boots the providers and router and lands on instruments', async () => {
    render(<App />)

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Instruments' }),
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe('/instruments')
  })
})
