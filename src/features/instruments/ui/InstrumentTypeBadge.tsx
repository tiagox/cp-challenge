import { useTranslation } from 'react-i18next'
import type { InstrumentType } from '@/entities/instrument/model/types'
import { Badge } from '@/shared/ui/Badge'

export function InstrumentTypeBadge({ type }: { type: InstrumentType }) {
  const { t } = useTranslation()

  return (
    <Badge variant={type === 'MONEDA' ? 'info' : 'neutral'}>{t(`instruments.type.${type}`)}</Badge>
  )
}
