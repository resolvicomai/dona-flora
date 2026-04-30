'use client'

import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { cn } from '@/lib/utils'

interface FilterResetButtonProps {
  onClick: () => void
  className?: string
}

export function FilterResetButton({ onClick, className }: FilterResetButtonProps) {
  const { locale } = useAppLanguage()
  const copy = {
    'pt-BR': {
      ariaLabel: 'Limpar todos os filtros',
      label: 'Limpar filtros',
    },
    en: {
      ariaLabel: 'Clear all filters',
      label: 'Clear filters',
    },
    es: {
      ariaLabel: 'Limpiar todos los filtros',
      label: 'Limpiar filtros',
    },
    'zh-CN': {
      ariaLabel: '清除所有筛选',
      label: '清除筛选',
    },
  }[locale]

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      aria-label={copy.ariaLabel}
      className={cn(
        'h-10 shrink-0 px-4 text-sm text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      <X className="size-3.5" aria-hidden="true" />
      <span>{copy.label}</span>
    </Button>
  )
}
