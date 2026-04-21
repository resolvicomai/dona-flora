import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { BookStatus } from '@/lib/books/schema'

const STATUS_CONFIG: Record<BookStatus, { label: string; className: string }> = {
  'quero-ler': {
    label: 'Quero ler',
    className: 'border-hairline bg-surface text-foreground',
  },
  'lendo': {
    label: 'Lendo',
    className: 'border-transparent bg-foreground/[0.08] text-foreground',
  },
  'lido': {
    label: 'Lido',
    className: 'border-transparent bg-primary text-primary-foreground shadow-mac-sm',
  },
  'quero-reler': {
    label: 'Quero reler',
    className: 'border-hairline bg-surface-strong text-foreground',
  },
  'abandonado': {
    label: 'Abandonado',
    className: 'border-hairline bg-transparent text-muted-foreground',
  },
}

interface StatusBadgeProps {
  status: BookStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
