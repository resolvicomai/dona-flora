'use client'

import { LayoutGrid, List } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

type ViewMode = 'grid' | 'list'

interface ViewToggleProps {
  value: ViewMode
  onChange: (next: ViewMode) => void
  className?: string
}

/**
 * Single-select grid/list toggle.
 *
 * base-ui Note: ToggleGroup stores its value as `Value[]` even in single-select
 * mode (omitting `multiple`). In that mode onValueChange fires with either
 * `[value]` (newly pressed) or `[]` (pressed-off). We guard by taking the first
 * element and only forwarding known values — invalid entries are ignored
 * (Phase 2 D-15 precedent on guarding unexpected Select payloads).
 */
export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(next) => {
        const picked = next[0]
        if (picked === 'grid' || picked === 'list') onChange(picked)
      }}
      aria-label="Modo de visualização"
      spacing={4}
      className={cn('flex gap-1', className)}
    >
      <ToggleGroupItem
        value="grid"
        aria-label="Visualizar em grade"
        className={cn(
          'min-h-[44px] md:min-h-9 min-w-[44px] md:min-w-9 rounded-md border border-zinc-700 bg-transparent text-zinc-300',
          'hover:border-zinc-500',
          'data-[pressed]:bg-zinc-100 data-[pressed]:text-zinc-900 data-[pressed]:border-transparent',
          'focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
          'transition-colors flex items-center justify-center',
        )}
      >
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="list"
        aria-label="Visualizar em lista"
        className={cn(
          'min-h-[44px] md:min-h-9 min-w-[44px] md:min-w-9 rounded-md border border-zinc-700 bg-transparent text-zinc-300',
          'hover:border-zinc-500',
          'data-[pressed]:bg-zinc-100 data-[pressed]:text-zinc-900 data-[pressed]:border-transparent',
          'focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
          'transition-colors flex items-center justify-center',
        )}
      >
        <List className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
