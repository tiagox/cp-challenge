import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { aggregatePortfolio } from '@/entities/position/model/metrics'
import type { Portfolio } from '@/entities/position/model/types'
import { Card } from '@/shared/ui/Card'
import { MoneyText } from '@/shared/ui/MoneyText'
import { PercentText } from '@/shared/ui/PercentText'
import styles from './PortfolioSummary.module.scss'

export interface PortfolioSummaryProps {
  portfolio: Portfolio
}

export function PortfolioSummary({ portfolio }: PortfolioSummaryProps) {
  const { t } = useTranslation()
  const metrics = aggregatePortfolio(portfolio.holdings)

  const items: { key: string; label: string; value: ReactNode }[] = [
    {
      key: 'cash',
      label: t('portfolio.summary.cash'),
      value: <MoneyText value={portfolio.cash} />,
    },
    {
      key: 'marketValue',
      label: t('portfolio.summary.marketValue'),
      value: <MoneyText value={metrics.marketValue} />,
    },
    {
      key: 'profitLoss',
      label: t('portfolio.summary.profitLoss'),
      value: (
        <MoneyText
          value={metrics.profitLoss}
          signed
          tone={metrics.profitLoss >= 0 ? 'positive' : 'negative'}
        />
      ),
    },
    {
      key: 'return',
      label: t('portfolio.summary.return'),
      value: <PercentText value={metrics.returnPercent} tone="auto" />,
    },
  ]

  return (
    <dl className={styles.grid}>
      {items.map((item) => (
        <Card key={item.key} className={styles.card}>
          <dt className={styles.label}>{item.label}</dt>
          <dd className={styles.value}>{item.value}</dd>
        </Card>
      ))}
    </dl>
  )
}
