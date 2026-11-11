import { Briefcase, ChartLine, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  labelKey: 'nav.instruments' | 'nav.portfolio'
  icon: LucideIcon
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/instruments', labelKey: 'nav.instruments', icon: ChartLine },
  { to: '/portfolio', labelKey: 'nav.portfolio', icon: Briefcase },
]
