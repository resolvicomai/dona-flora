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
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import type { SortKey, SortDir } from '@/lib/books/search-params'
import type { AppLanguage } from '@/lib/i18n/app-language'
import { cn } from '@/lib/utils'

/** Human-readable label for each sort key, in display order (UI-SPEC Copywriting). */
export const SORT_OPTIONS: ReadonlyArray<{ value: SortKey }> = [
  { value: 'added_at' },
  { value: 'title' },
  { value: 'author' },
  { value: 'rating' },
] as const

const SORT_COPY: Record<
  AppLanguage,
  {
    asc: string
    desc: string
    fallback: string
    label: string
    options: Record<SortKey, string>
  }
> = {
  'pt-BR': {
    asc: 'Ordem crescente',
    desc: 'Ordem decrescente',
    fallback: 'Ordenar',
    label: 'Ordenar por',
    options: {
      added_at: 'Adicionado recentemente',
      title: 'Título',
      author: 'Autor',
      rating: 'Nota',
    },
  },
  en: {
    asc: 'Ascending order',
    desc: 'Descending order',
    fallback: 'Sort',
    label: 'Sort by',
    options: {
      added_at: 'Recently added',
      title: 'Title',
      author: 'Author',
      rating: 'Rating',
    },
  },
  es: {
    asc: 'Orden ascendente',
    desc: 'Orden descendente',
    fallback: 'Ordenar',
    label: 'Ordenar por',
    options: {
      added_at: 'Agregado recientemente',
      title: 'Título',
      author: 'Autor',
      rating: 'Nota',
    },
  },
  'zh-CN': {
    asc: '升序',
    desc: '降序',
    fallback: '排序',
    label: '排序方式',
    options: {
      added_at: '最近添加',
      title: '标题',
      author: '作者',
      rating: '评分',
    },
  },
}

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
  const { locale } = useAppLanguage()
  const copy = SORT_COPY[locale]

  function handleKeyChange(v: string | null) {
    if (!v) return
    const next = v as SortKey
    onChange(next, SORT_DEFAULT_DIR[next])
  }

  function toggleDir() {
    onChange(sort, dir === 'asc' ? 'desc' : 'asc')
  }

  const currentLabel =
    copy.options[SORT_OPTIONS.find((o) => o.value === sort)?.value ?? sort] ??
    copy.fallback
  const dirLabel = dir === 'asc' ? copy.asc : copy.desc

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <span className="sr-only font-mono text-xs tracking-normal text-muted-foreground md:not-sr-only">
        {copy.label}
      </span>
      <Select value={sort} onValueChange={handleKeyChange}>
        <SelectTrigger
          className="h-10 min-w-0 flex-1 sm:w-[15.5rem] sm:flex-none"
          aria-label={copy.label}
        >
          <SelectValue>{currentLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {copy.options[opt.value]}
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
        className="size-10"
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
