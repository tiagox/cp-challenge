import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { renderWithProviders } from './render'

function ModalHarness({ description }: { description?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Order ticket"
        description={description}
        footer={<Button>Submit</Button>}
      >
        <input aria-label="Quantity" />
      </Modal>
    </>
  )
}

async function openModal(description?: string) {
  const user = userEvent.setup()
  renderWithProviders(<ModalHarness description={description} />)
  await user.click(screen.getByRole('button', { name: 'Open' }))
  return { user, dialog: await screen.findByRole('dialog', { name: 'Order ticket' }) }
}

describe('Modal', () => {
  it('opens with title and description', async () => {
    const { dialog } = await openModal('Buy or sell')

    expect(dialog).toHaveAccessibleDescription('Buy or sell')
    expect(screen.getByRole('heading', { name: 'Order ticket' })).toBeInTheDocument()
  })

  it('sets no aria-describedby without a description', async () => {
    const { dialog } = await openModal()

    expect(dialog).not.toHaveAttribute('aria-describedby')
  })

  it('closes with the close button', async () => {
    const { user } = await openModal()

    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes with Escape', async () => {
    const { user } = await openModal()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('traps focus inside while open', async () => {
    const { user, dialog } = await openModal()

    for (let i = 0; i < 6; i++) {
      await user.tab()
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    }
    await user.tab({ shift: true })
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
  })

  it('labels the close button in Spanish', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ModalHarness />, { lang: 'es' })
    await user.click(screen.getByRole('button', { name: 'Open' }))

    expect(await screen.findByRole('button', { name: 'Cerrar' })).toBeInTheDocument()
  })
})
