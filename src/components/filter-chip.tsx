'use client'

import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface FilterChipProps {
  label: string
  count?: number
  isActive: boolean
  children: ReactNode
  className?: string
  contentClassName?: string
}

function formatSelectionLabel(label: string, count?: number) {
  if (!count) return label
  return `${label} · ${count}`
}

function formatAriaLabel(label: string, count?: number) {
  if (!count) return `Filtrar por ${label.toLowerCase()}`
  return `Filtrar por ${label.toLowerCase()}, ${count} selecionado${count === 1 ? '' : 's'}`
}

export function FilterChip({
  label,
  count,
  isActive,
  children,
  className,
  contentClassName,
}: FilterChipProps) {
  const ariaLabel = formatAriaLabel(label, count)

  return (
    <Popover>
      <PopoverTrigger
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        title={ariaLabel}
        className={cn(
          'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium tabular-nums transition-colors duration-[var(--motion-fast)] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          isActive
            ? 'border-transparent bg-primary text-primary-foreground shadow-mac-sm'
            : 'border-border bg-background text-foreground hover:border-border/80 hover:bg-accent',
          className,
        )}
      >
        <span className="truncate">{formatSelectionLabel(label, count)}</span>
        <ChevronDown className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={10}
        className={cn('w-64 p-3', contentClassName)}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}
