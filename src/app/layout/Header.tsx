import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router-dom'
import { cx } from '@/shared/lib/cx'
import { Container } from './Container'
import styles from './Header.module.scss'
import { LanguageSwitcher } from './LanguageSwitcher'
import { NAV_ITEMS } from './navItems'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  const { t } = useTranslation()

  return (
    <header className={styles.header}>
      <Container className={styles.inner}>
        <Link to="/instruments" className={styles.brand}>
          {t('common.appName')}
        </Link>
        <nav aria-label={t('nav.mainNavigation')} className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cx(styles.navLink, isActive && styles.active)}
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
        <div className={styles.actions}>
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </Container>
    </header>
  )
}
