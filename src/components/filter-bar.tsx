'use client'

import type { ReactNode } from 'react'
import { Check, Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from '@/components/ui/popover'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FilterChip } from '@/components/filter-chip'
import { FilterResetButton } from '@/components/filter-reset-button'
import { SearchInput } from '@/components/search-input'
import { SortSelect } from '@/components/sort-select'
import { ViewToggle } from '@/components/view-toggle'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import type { BookStatus } from '@/lib/books/schema'
import type { SortDir, SortKey } from '@/lib/books/search-params'
import { getStatusOptions } from '@/lib/books/status-labels'
import { cn } from '@/lib/utils'

interface FilterBarState {
  status: BookStatus[]
  rating: number[]
  genre: string[]
  q: string
  sort: SortKey
  dir: SortDir
}

interface FilterBarProps {
  state: FilterBarState
  onChange: (patch: Partial<FilterBarState>) => void
  onReset: () => void
  view: 'grid' | 'list'
  onViewChange: (next: 'grid' | 'list') => void
  genres: Array<{ key: string; label: string }>
}

type RatingValue = '1' | '2' | '3' | '4' | '5'

const RATING_OPTIONS: ReadonlyArray<{
  value: RatingValue
  label: string
  leading: ReactNode
}> = [
  {
    value: '5',
    label: '5 estrelas',
    leading: <Star className="size-3.5 fill-foreground text-foreground" aria-hidden="true" />,
  },
  {
    value: '4',
    label: '4 estrelas',
    leading: <Star className="size-3.5 fill-foreground text-foreground" aria-hidden="true" />,
  },
  {
    value: '3',
    label: '3 estrelas',
    leading: <Star className="size-3.5 fill-foreground text-foreground" aria-hidden="true" />,
  },
  {
    value: '2',
    label: '2 estrelas',
    leading: <Star className="size-3.5 fill-foreground text-foreground" aria-hidden="true" />,
  },
  {
    value: '1',
    label: '1 estrela',
    leading: <Star className="size-3.5 fill-foreground text-foreground" aria-hidden="true" />,
  },
] as const

const groupOptionClassName = cn(
  'group surface-transition flex h-11 w-full items-center justify-between rounded-[1.2rem] border border-hairline bg-surface px-3.5 text-left text-sm text-foreground shadow-mac-sm outline-none',
  'hover:bg-surface-strong hover:text-foreground',
  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  'data-[pressed]:border-transparent data-[pressed]:bg-primary data-[pressed]:text-primary-foreground data-[pressed]:shadow-mac-md',
)

export function FilterBar({
  state,
  onChange,
  onReset,
  view,
  onViewChange,
  genres,
}: FilterBarProps) {
  const { locale } = useAppLanguage()
  const statusOptions = getStatusOptions(locale)
  const genreOptions = genres.map((g) => ({ value: g.key, label: g.label }))
  const ratingStringValue = state.rating.map(String) as RatingValue[]
  const hasActiveFilters =
    state.q.trim() !== '' ||
    state.status.length > 0 ||
    state.rating.length > 0 ||
    state.genre.length > 0

  return (
    <div className="sticky top-[var(--app-nav-offset)] z-20">
      <div className="surface-blur flex flex-col gap-4 rounded-[2rem] border border-glass-border px-4 py-4 md:px-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-3">
          <SearchInput
            value={state.q}
            onChange={(q) => onChange({ q })}
            className="w-full xl:max-w-[28rem]"
          />
          <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
            <SortSelect
              sort={state.sort}
              dir={state.dir}
              onChange={(sort, dir) => onChange({ sort, dir })}
            />
            <ViewToggle value={view} onChange={onViewChange} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            label="Status"
            count={state.status.length}
            isActive={state.status.length > 0}
          >
            <PopoverHeader>
              <PopoverTitle className="text-sm font-medium text-foreground">
                Filtrar por status
              </PopoverTitle>
              <PopoverDescription>
                {state.status.length > 0
                  ? `${state.status.length} selecionado${state.status.length === 1 ? '' : 's'}`
                  : 'Selecione um ou mais status.'}
              </PopoverDescription>
            </PopoverHeader>
            <ToggleGroup
              multiple
              aria-label="Status"
              value={state.status}
              onValueChange={(next) => onChange({ status: next as BookStatus[] })}
              spacing={4}
              className="flex flex-col gap-1"
            >
              {statusOptions.map((opt) => (
                <ToggleGroupItem key={opt.value} value={opt.value} className={groupOptionClassName}>
                  <span>{opt.label}</span>
                  <Check className="size-3.5 opacity-0 transition-opacity group-data-[pressed]:opacity-100" aria-hidden="true" />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {state.status.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange({ status: [] })}
                className="mt-2 h-9 w-full justify-start rounded-full px-3 text-xs text-muted-foreground"
              >
                Limpar
              </Button>
            )}
          </FilterChip>

          <FilterChip
            label="Nota"
            count={state.rating.length}
            isActive={state.rating.length > 0}
          >
            <PopoverHeader>
              <PopoverTitle className="text-sm font-medium text-foreground">
                Filtrar por nota
              </PopoverTitle>
              <PopoverDescription>
                {state.rating.length > 0
                  ? `${state.rating.length} selecionada${state.rating.length === 1 ? '' : 's'}`
                  : 'Selecione uma ou mais notas.'}
              </PopoverDescription>
            </PopoverHeader>
            <ToggleGroup
              multiple
              aria-label="Notas"
              value={ratingStringValue}
              onValueChange={(next) =>
                onChange({
                  rating: next
                    .map((n) => Number(n))
                    .filter((n) => !Number.isNaN(n)),
                })
              }
              spacing={4}
              className="flex flex-col gap-1"
            >
              {RATING_OPTIONS.map((opt) => (
                <ToggleGroupItem key={opt.value} value={opt.value} className={groupOptionClassName}>
                  <span className="flex items-center gap-2">
                    {opt.leading}
                    <span>{opt.label}</span>
                  </span>
                  <Check className="size-3.5 opacity-0 transition-opacity group-data-[pressed]:opacity-100" aria-hidden="true" />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {state.rating.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange({ rating: [] })}
                className="mt-2 h-9 w-full justify-start rounded-full px-3 text-xs text-muted-foreground"
              >
                Limpar
              </Button>
            )}
          </FilterChip>

          {genreOptions.length > 0 && (
            <FilterChip
              label="Gênero"
              count={state.genre.length}
              isActive={state.genre.length > 0}
            >
              <PopoverHeader>
                <PopoverTitle className="text-sm font-medium text-foreground">
                  Filtrar por gênero
                </PopoverTitle>
                <PopoverDescription>
                  {state.genre.length > 0
                    ? `${state.genre.length} selecionado${state.genre.length === 1 ? '' : 's'}`
                    : 'Selecione um ou mais gêneros.'}
                </PopoverDescription>
              </PopoverHeader>
              <div className="max-h-56 overflow-y-auto pr-1">
                <ToggleGroup
                  multiple
                  aria-label="Gêneros"
                  value={state.genre}
                  onValueChange={(genre) => onChange({ genre })}
                  spacing={4}
                  className="flex flex-col gap-1"
                >
                  {genreOptions.map((opt) => (
                    <ToggleGroupItem key={opt.value} value={opt.value} className={groupOptionClassName}>
                      <span className="truncate">{opt.label}</span>
                      <Check className="size-3.5 opacity-0 transition-opacity group-data-[pressed]:opacity-100" aria-hidden="true" />
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              {state.genre.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange({ genre: [] })}
                  className="mt-2 h-9 w-full justify-start rounded-full px-3 text-xs text-muted-foreground"
                >
                  Limpar
                </Button>
              )}
            </FilterChip>
          )}

          {hasActiveFilters && <FilterResetButton onClick={onReset} className="xl:ml-auto" />}
        </div>
      </div>
    </div>
  )
}
