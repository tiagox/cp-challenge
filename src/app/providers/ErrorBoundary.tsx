import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/Button'
import styles from './ErrorBoundary.module.scss'

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()

  return (
    <div role="alert" className={styles.fallback}>
      <h1 className={styles.title}>{t('common.unexpectedErrorTitle')}</h1>
      <p className={styles.description}>{t('common.unexpectedErrorDescription')}</p>
      <Button onClick={onRetry}>{t('common.retry')}</Button>
    </div>
  )
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) console.error(error, info.componentStack)
  }

  reset = (): void => {
    this.setState({ hasError: false })
  }

  render(): ReactNode {
    if (this.state.hasError) return <ErrorFallback onRetry={this.reset} />
    return this.props.children
  }
}
