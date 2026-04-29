'use client'

import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
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

export function FilterChip({
  label,
  count,
  isActive,
  children,
  className,
  contentClassName,
}: FilterChipProps) {
  const { locale } = useAppLanguage()
  const ariaLabel = {
    'pt-BR': !count
      ? `Filtrar por ${label.toLowerCase()}`
      : `Filtrar por ${label.toLowerCase()}, ${count} selecionado${count === 1 ? '' : 's'}`,
    en: !count
      ? `Filter by ${label.toLowerCase()}`
      : `Filter by ${label.toLowerCase()}, ${count} selected`,
    es: !count
      ? `Filtrar por ${label.toLowerCase()}`
      : `Filtrar por ${label.toLowerCase()}, ${count} seleccionado${count === 1 ? '' : 's'}`,
    'zh-CN': !count ? `按${label}筛选` : `按${label}筛选，已选择 ${count} 项`,
  }[locale]

  return (
    <Popover>
      <PopoverTrigger
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        title={ariaLabel}
        className={cn(
          'surface-transition inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md border px-3.5 text-sm font-medium tabular-nums shadow-none outline-none hover:-translate-y-px active:translate-y-px focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          isActive
            ? 'border-transparent bg-primary text-primary-foreground'
            : 'border-hairline bg-surface-elevated text-foreground hover:bg-surface-strong',
          className,
        )}
      >
        <span className="truncate">{formatSelectionLabel(label, count)}</span>
        <ChevronDown className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={10} className={cn('w-72', contentClassName)}>
        {children}
      </PopoverContent>
    </Popover>
  )
}
