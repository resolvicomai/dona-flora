import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { BookStatus } from '@/lib/books/schema'

const STATUS_CONFIG: Record<BookStatus, { label: string; className: string }> = {
  'quero-ler': { label: 'Quero ler', className: 'bg-zinc-800 text-zinc-300' },
  'lendo': { label: 'Lendo', className: 'bg-blue-900/50 text-blue-400' },
  'lido': { label: 'Lido', className: 'bg-green-900/50 text-green-400' },
  'quero-reler': { label: 'Quero reler', className: 'bg-amber-900/50 text-amber-400' },
  'abandonado': { label: 'Abandonado', className: 'bg-zinc-800 text-zinc-500' },
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
