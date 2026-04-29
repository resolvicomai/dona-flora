import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { BookStatus } from '@/lib/books/schema'
import type { AppLanguage } from '@/lib/i18n/app-language'
import { getStatusLabel } from '@/lib/books/status-labels'

const STATUS_CONFIG: Record<BookStatus, { className: string }> = {
  'quero-ler': {
    className: 'border-hairline-strong bg-surface text-foreground',
  },
  'lendo': {
    className: 'border-hairline-strong bg-foreground/[0.1] text-foreground',
  },
  'lido': {
    className: 'border-transparent bg-primary text-primary-foreground shadow-none',
  },
  'quero-reler': {
    className: 'border-hairline-strong bg-surface-strong text-foreground',
  },
  'abandonado': {
    className: 'border-hairline bg-transparent text-foreground/72',
  },
}

interface StatusBadgeProps {
  status: BookStatus
  className?: string
  locale?: AppLanguage
}

export function StatusBadge({ status, className, locale = 'pt-BR' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {getStatusLabel(status, locale)}
    </Badge>
  )
}
