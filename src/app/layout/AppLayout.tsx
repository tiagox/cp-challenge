import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { RouteFallback } from '@/shared/ui/RouteFallback'
import { DebugPanel } from '../debug/DebugPanel'
import styles from './AppLayout.module.scss'
import { Container } from './Container'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { OrderModalContainer } from './OrderModalContainer'
import { SkipLink } from './SkipLink'

export function AppLayout() {
  return (
    <div className={styles.shell}>
      <SkipLink />
      <Header />
      <main id="main" className={styles.main} tabIndex={-1}>
        <Container>
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </Container>
      </main>
      <MobileNav />
      <OrderModalContainer />
      <DebugPanel />
    </div>
  )
}
