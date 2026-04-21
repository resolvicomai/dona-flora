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
      className={cn('glass-pill flex rounded-full p-1', className)}
    >
      <ToggleGroupItem
        value="grid"
        aria-label="Visualizar em grade"
        className={cn(
          'size-9 rounded-full border border-transparent bg-transparent text-muted-foreground shadow-none transition-colors',
          'hover:text-foreground',
          'data-[pressed]:bg-primary data-[pressed]:text-primary-foreground data-[pressed]:shadow-mac-sm',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'flex items-center justify-center',
        )}
      >
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="list"
        aria-label="Visualizar em lista"
        className={cn(
          'size-9 rounded-full border border-transparent bg-transparent text-muted-foreground shadow-none transition-colors',
          'hover:text-foreground',
          'data-[pressed]:bg-primary data-[pressed]:text-primary-foreground data-[pressed]:shadow-mac-sm',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'flex items-center justify-center',
        )}
      >
        <List className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
