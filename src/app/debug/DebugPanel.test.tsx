import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BUG_MODE_STORAGE_KEY, CANDIDATE_STORAGE_KEY } from '@/shared/api/config'
import { renderWithProviders } from '@/test/render'
import { DEBUG_STORAGE_KEY, DebugPanel } from './DebugPanel'

// jsdom hides `[popover]` but does not open it from `popovertarget`, so panel controls are queried with `hidden`
// and driven with fireEvent (user-event cannot focus hidden elements).
const hidden = { hidden: true }

describe('DebugPanel', () => {
  it('renders nothing without the debug flag', () => {
    renderWithProviders(<DebugPanel />)

    expect(screen.queryByRole('button', { name: 'Debug tools' })).not.toBeInTheDocument()
  })

  it('turns debug mode on from ?debug and remembers it', () => {
    renderWithProviders(<DebugPanel />, { route: '/instruments?debug' })

    expect(screen.getByRole('button', { name: 'Debug tools' })).toBeInTheDocument()
    expect(localStorage.getItem(DEBUG_STORAGE_KEY)).toBe('1')
  })

  it('turns debug mode off from ?debug=off', () => {
    localStorage.setItem(DEBUG_STORAGE_KEY, '1')
    renderWithProviders(<DebugPanel />, { route: '/?debug=off' })

    expect(screen.queryByRole('button', { name: 'Debug tools' })).not.toBeInTheDocument()
    expect(localStorage.getItem(DEBUG_STORAGE_KEY)).toBeNull()
  })

  it('stores the bug mode and candidate', () => {
    localStorage.setItem(DEBUG_STORAGE_KEY, '1')
    renderWithProviders(<DebugPanel />)

    fireEvent.change(screen.getByRole('combobox', { name: 'X-Enable-Bugs', ...hidden }), {
      target: { value: 'medium' },
    })
    expect(localStorage.getItem(BUG_MODE_STORAGE_KEY)).toBe('medium')

    fireEvent.change(screen.getByRole('textbox', { name: 'X-Candidate-Id', ...hidden }), {
      target: { value: 'debug-candidate' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Apply', ...hidden }))
    expect(localStorage.getItem(CANDIDATE_STORAGE_KEY)).toBe('debug-candidate')

    fireEvent.click(screen.getByRole('button', { name: 'Turn off debug', ...hidden }))
    expect(screen.queryByRole('button', { name: 'Debug tools' })).not.toBeInTheDocument()
    expect(localStorage.getItem(DEBUG_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(BUG_MODE_STORAGE_KEY)).toBeNull()
  })

  it('renders in Spanish', () => {
    localStorage.setItem(DEBUG_STORAGE_KEY, '1')
    renderWithProviders(<DebugPanel />, { lang: 'es' })

    expect(screen.getByRole('button', { name: 'Herramientas de depuración' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aplicar', ...hidden })).toBeInTheDocument()
  })
})
