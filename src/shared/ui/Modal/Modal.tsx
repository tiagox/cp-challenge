import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '../IconButton'
import styles from './Modal.module.scss'

export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ open, onOpenChange, title, description, children, footer }: ModalProps) {
  const { t } = useTranslation()

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          className={styles.content}
          // Without a description, opt out explicitly so no orphan `aria-describedby` is set.
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <header className={styles.header}>
            <div className={styles.heading}>
              <Dialog.Title className={styles.title}>{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className={styles.description}>
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close asChild>
              <IconButton label={t('common.close')} icon={<X />} variant="ghost" size="sm" />
            </Dialog.Close>
          </header>
          <div className={styles.body}>{children}</div>
          {footer ? <footer className={styles.footer}>{footer}</footer> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
