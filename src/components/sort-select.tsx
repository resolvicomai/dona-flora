'use client'

import { ArrowUpDown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { SortKey, SortDir } from '@/lib/books/search-params'
import { cn } from '@/lib/utils'

interface SortOption {
  value: SortKey
  label: string
}

/** Human-readable label for each sort key, in display order (UI-SPEC Copywriting). */
export const SORT_OPTIONS: ReadonlyArray<SortOption> = [
  { value: 'added_at', label: 'Adicionado recentemente' },
  { value: 'title', label: 'Título' },
  { value: 'author', label: 'Autor' },
  { value: 'rating', label: 'Nota' },
] as const

/**
 * Default sort direction per key (UI-SPEC §Specifics):
 *  - added_at / rating -> DESC (newest / highest first)
 *  - title / author    -> ASC  (alphabetical)
 */
export const SORT_DEFAULT_DIR: Record<SortKey, SortDir> = {
  added_at: 'desc',
  title: 'asc',
  author: 'asc',
  rating: 'desc',
}

interface SortSelectProps {
  sort: SortKey
  dir: SortDir
  onChange: (sort: SortKey, dir: SortDir) => void
  className?: string
}

/**
 * Combined sort key selector + direction toggle button.
 *
 * - Changing the key flips direction to `SORT_DEFAULT_DIR[newKey]`.
 * - The ArrowUpDown button toggles direction independently (asc <-> desc).
 * - base-ui Select single-mode emits `string | null` to onValueChange; guard
 *   with `if (!v) return` (Phase 2 D-15 precedent).
 *
 * The "Ordenar por" label is screen-reader-only on mobile (`sr-only`) and
 * visible on desktop (`md:not-sr-only`) to save row space.
 */
export function SortSelect({ sort, dir, onChange, className }: SortSelectProps) {
  function handleKeyChange(v: string | null) {
    if (!v) return
    const next = v as SortKey
    onChange(next, SORT_DEFAULT_DIR[next])
  }

  function toggleDir() {
    onChange(sort, dir === 'asc' ? 'desc' : 'asc')
  }

  const currentLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Ordenar'
  const dirLabel = dir === 'asc' ? 'Ordem crescente' : 'Ordem decrescente'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="sr-only md:not-sr-only text-xs text-muted-foreground">
        Ordenar por
      </span>
      <Select value={sort} onValueChange={handleKeyChange}>
        <SelectTrigger
          className="h-8 w-48 rounded-md border-border bg-card/90 text-sm text-foreground shadow-mac-sm"
          aria-label="Ordenar por"
        >
          <SelectValue>{currentLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={toggleDir}
        aria-label={dirLabel}
        title={dirLabel}
        className="rounded-md border-border bg-card/90 shadow-mac-sm"
      >
        <ArrowUpDown
          className={cn(
            'h-4 w-4 transition-transform',
            dir === 'asc' && 'rotate-180',
          )}
        />
      </Button>
    </div>
  )
}
