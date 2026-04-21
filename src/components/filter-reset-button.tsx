'use client'

import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FilterResetButtonProps {
  onClick: () => void
  className?: string
}

export function FilterResetButton({
  onClick,
  className,
}: FilterResetButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      aria-label="Limpar todos os filtros"
      className={cn(
        'h-10 shrink-0 px-4 text-sm text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      <X className="size-3.5" aria-hidden="true" />
      <span>Limpar filtros</span>
    </Button>
  )
}
