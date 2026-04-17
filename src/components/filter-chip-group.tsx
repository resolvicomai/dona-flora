'use client'

import type { ReactNode } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

interface FilterChipGroupProps<T extends string> {
  label: string
  options: ReadonlyArray<{ value: T; label: string; leading?: ReactNode }>
  value: T[]
  onValueChange: (next: T[]) => void
  className?: string
}

/**
 * Generic multi-select chip group wrapping base-ui ToggleGroup.
 *
 * Contract (per base-ui API):
 * - `multiple` boolean prop enables multi-select (do NOT use Radix-style type=multiple).
 * - `value` is always an array; `onValueChange` always receives `Value[]`.
 * - Active state uses `data-[pressed]` data attribute from the Toggle primitive.
 *
 * Styling tokens (UI-SPEC §Color):
 * - Inactive: `border-zinc-700 text-zinc-300 bg-transparent`
 * - Active  : `bg-zinc-100 text-zinc-900 border-transparent` (accent inverted)
 * - Focus   : `focus-visible:ring-2 focus-visible:ring-zinc-400` over zinc-950 offset
 *
 * Touch targets: `min-h-[44px]` on mobile; `md:min-h-9` (36px) on desktop.
 */
export function FilterChipGroup<T extends string>({
  label,
  options,
  value,
  onValueChange,
  className,
}: FilterChipGroupProps<T>) {
  return (
    <ToggleGroup
      multiple
      value={value}
      onValueChange={(next) => onValueChange(next as T[])}
      aria-label={label}
      spacing={8}
      className={cn('flex gap-2', className)}
    >
      {options.map((opt) => (
        <ToggleGroupItem
          key={opt.value}
          value={opt.value}
          className={cn(
            'min-h-[44px] md:min-h-9 rounded-full border border-zinc-700 bg-transparent px-3 text-xs text-zinc-300',
            'hover:border-zinc-500',
            'data-[pressed]:bg-zinc-100 data-[pressed]:text-zinc-900 data-[pressed]:border-transparent',
            'focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
            'transition-colors flex items-center gap-1.5',
          )}
        >
          {opt.leading}
          <span>{opt.label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
