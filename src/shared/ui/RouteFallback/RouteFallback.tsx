import { Spinner } from '../Spinner'
import styles from './RouteFallback.module.scss'

export function RouteFallback() {
  return (
    <div className={styles.fallback}>
      <Spinner />
    </div>
  )
}
