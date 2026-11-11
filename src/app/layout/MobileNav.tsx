import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { cx } from '@/shared/lib/cx'
import styles from './MobileNav.module.scss'
import { NAV_ITEMS } from './navItems'

export function MobileNav() {
  const { t } = useTranslation()

  return (
    <nav aria-label={t('nav.mainNavigation')} className={styles.nav}>
      {NAV_ITEMS.map(({ to, labelKey, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => cx(styles.tab, isActive && styles.active)}
        >
          <Icon aria-hidden="true" />
          {t(labelKey)}
        </NavLink>
      ))}
    </nav>
  )
}
