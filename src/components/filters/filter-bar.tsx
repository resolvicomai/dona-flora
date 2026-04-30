'use client'

import type { ReactNode } from 'react'
import { Check, Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PopoverDescription, PopoverHeader, PopoverTitle } from '@/components/ui/popover'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FilterChip } from '@/components/filters/filter-chip'
import { FilterResetButton } from '@/components/filters/filter-reset-button'
import { SearchInput } from '@/components/filters/search-input'
import { SortSelect } from '@/components/filters/sort-select'
import { ViewToggle } from '@/components/filters/view-toggle'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import type { BookStatus } from '@/lib/books/schema'
import type { SortDir, SortKey } from '@/lib/books/search-params'
import type { AppLanguage } from '@/lib/i18n/app-language'
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
  leading: ReactNode
}> = [
  {
    value: '5',
    leading: <Star className="size-3.5 fill-foreground text-foreground" aria-hidden="true" />,
  },
  {
    value: '4',
    leading: <Star className="size-3.5 fill-foreground text-foreground" aria-hidden="true" />,
  },
  {
    value: '3',
    leading: <Star className="size-3.5 fill-foreground text-foreground" aria-hidden="true" />,
  },
  {
    value: '2',
    leading: <Star className="size-3.5 fill-foreground text-foreground" aria-hidden="true" />,
  },
  {
    value: '1',
    leading: <Star className="size-3.5 fill-foreground text-foreground" aria-hidden="true" />,
  },
] as const

const FILTER_COPY: Record<
  AppLanguage,
  {
    clear: string
    genre: {
      aria: string
      empty: string
      label: string
      selected: (count: number) => string
      title: string
    }
    rating: {
      aria: string
      empty: string
      label: string
      option: (value: RatingValue) => string
      selected: (count: number) => string
      title: string
    }
    status: {
      aria: string
      empty: string
      label: string
      selected: (count: number) => string
      title: string
    }
  }
> = {
  'pt-BR': {
    clear: 'Limpar',
    genre: {
      aria: 'Gêneros',
      empty: 'Selecione um ou mais gêneros.',
      label: 'Gênero',
      selected: (count) => `${count} selecionado${count === 1 ? '' : 's'}`,
      title: 'Filtrar por gênero',
    },
    rating: {
      aria: 'Notas',
      empty: 'Selecione uma ou mais notas.',
      label: 'Nota',
      option: (value) => `${value} estrela${value === '1' ? '' : 's'}`,
      selected: (count) => `${count} selecionada${count === 1 ? '' : 's'}`,
      title: 'Filtrar por nota',
    },
    status: {
      aria: 'Status',
      empty: 'Selecione um ou mais status.',
      label: 'Status',
      selected: (count) => `${count} selecionado${count === 1 ? '' : 's'}`,
      title: 'Filtrar por status',
    },
  },
  en: {
    clear: 'Clear',
    genre: {
      aria: 'Genres',
      empty: 'Select one or more genres.',
      label: 'Genre',
      selected: (count) => `${count} selected`,
      title: 'Filter by genre',
    },
    rating: {
      aria: 'Ratings',
      empty: 'Select one or more ratings.',
      label: 'Rating',
      option: (value) => `${value} star${value === '1' ? '' : 's'}`,
      selected: (count) => `${count} selected`,
      title: 'Filter by rating',
    },
    status: {
      aria: 'Status',
      empty: 'Select one or more statuses.',
      label: 'Status',
      selected: (count) => `${count} selected`,
      title: 'Filter by status',
    },
  },
  es: {
    clear: 'Limpiar',
    genre: {
      aria: 'Géneros',
      empty: 'Selecciona uno o más géneros.',
      label: 'Género',
      selected: (count) => `${count} seleccionado${count === 1 ? '' : 's'}`,
      title: 'Filtrar por género',
    },
    rating: {
      aria: 'Notas',
      empty: 'Selecciona una o más notas.',
      label: 'Nota',
      option: (value) => `${value} estrella${value === '1' ? '' : 's'}`,
      selected: (count) => `${count} seleccionada${count === 1 ? '' : 's'}`,
      title: 'Filtrar por nota',
    },
    status: {
      aria: 'Estado',
      empty: 'Selecciona uno o más estados.',
      label: 'Estado',
      selected: (count) => `${count} seleccionado${count === 1 ? '' : 's'}`,
      title: 'Filtrar por estado',
    },
  },
  'zh-CN': {
    clear: '清除',
    genre: {
      aria: '类型',
      empty: '选择一个或多个类型。',
      label: '类型',
      selected: (count) => `已选择 ${count} 项`,
      title: '按类型筛选',
    },
    rating: {
      aria: '评分',
      empty: '选择一个或多个评分。',
      label: '评分',
      option: (value) => `${value} 星`,
      selected: (count) => `已选择 ${count} 项`,
      title: '按评分筛选',
    },
    status: {
      aria: '状态',
      empty: '选择一个或多个状态。',
      label: '状态',
      selected: (count) => `已选择 ${count} 项`,
      title: '按状态筛选',
    },
  },
}

const groupOptionClassName = cn(
  'group surface-transition flex h-11 w-full items-center justify-between rounded-md border border-hairline bg-surface px-3.5 text-left text-sm text-foreground shadow-none outline-none',
  'hover:-translate-y-px hover:bg-surface-strong hover:text-foreground active:translate-y-px',
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
  const copy = FILTER_COPY[locale]
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
      <div className="brand-toolbar flex flex-col gap-3 px-4 py-3 md:px-5">
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

        <div className="flex flex-wrap items-center gap-2 border-t border-hairline pt-3">
          <FilterChip
            label={copy.status.label}
            count={state.status.length}
            isActive={state.status.length > 0}
          >
            <PopoverHeader>
              <PopoverTitle className="text-sm font-medium text-foreground">
                {copy.status.title}
              </PopoverTitle>
              <PopoverDescription>
                {state.status.length > 0
                  ? copy.status.selected(state.status.length)
                  : copy.status.empty}
              </PopoverDescription>
            </PopoverHeader>
            <ToggleGroup
              multiple
              aria-label={copy.status.aria}
              value={state.status}
              onValueChange={(next) => onChange({ status: next as BookStatus[] })}
              spacing={4}
              className="flex flex-col gap-1"
            >
              {statusOptions.map((opt) => (
                <ToggleGroupItem key={opt.value} value={opt.value} className={groupOptionClassName}>
                  <span>{opt.label}</span>
                  <Check
                    className="size-3.5 opacity-0 transition-opacity group-data-[pressed]:opacity-100"
                    aria-hidden="true"
                  />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {state.status.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange({ status: [] })}
                className="mt-2 h-9 w-full justify-start rounded-md px-3 text-xs text-muted-foreground"
              >
                {copy.clear}
              </Button>
            )}
          </FilterChip>

          <FilterChip
            label={copy.rating.label}
            count={state.rating.length}
            isActive={state.rating.length > 0}
          >
            <PopoverHeader>
              <PopoverTitle className="text-sm font-medium text-foreground">
                {copy.rating.title}
              </PopoverTitle>
              <PopoverDescription>
                {state.rating.length > 0
                  ? copy.rating.selected(state.rating.length)
                  : copy.rating.empty}
              </PopoverDescription>
            </PopoverHeader>
            <ToggleGroup
              multiple
              aria-label={copy.rating.aria}
              value={ratingStringValue}
              onValueChange={(next) =>
                onChange({
                  rating: next.map((n) => Number(n)).filter((n) => !Number.isNaN(n)),
                })
              }
              spacing={4}
              className="flex flex-col gap-1"
            >
              {RATING_OPTIONS.map((opt) => (
                <ToggleGroupItem key={opt.value} value={opt.value} className={groupOptionClassName}>
                  <span className="flex items-center gap-2">
                    {opt.leading}
                    <span>{copy.rating.option(opt.value)}</span>
                  </span>
                  <Check
                    className="size-3.5 opacity-0 transition-opacity group-data-[pressed]:opacity-100"
                    aria-hidden="true"
                  />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {state.rating.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange({ rating: [] })}
                className="mt-2 h-9 w-full justify-start rounded-md px-3 text-xs text-muted-foreground"
              >
                {copy.clear}
              </Button>
            )}
          </FilterChip>

          {genreOptions.length > 0 && (
            <FilterChip
              label={copy.genre.label}
              count={state.genre.length}
              isActive={state.genre.length > 0}
            >
              <PopoverHeader>
                <PopoverTitle className="text-sm font-medium text-foreground">
                  {copy.genre.title}
                </PopoverTitle>
                <PopoverDescription>
                  {state.genre.length > 0
                    ? copy.genre.selected(state.genre.length)
                    : copy.genre.empty}
                </PopoverDescription>
              </PopoverHeader>
              <div className="max-h-56 overflow-y-auto pr-1">
                <ToggleGroup
                  multiple
                  aria-label={copy.genre.aria}
                  value={state.genre}
                  onValueChange={(genre) => onChange({ genre })}
                  spacing={4}
                  className="flex flex-col gap-1"
                >
                  {genreOptions.map((opt) => (
                    <ToggleGroupItem
                      key={opt.value}
                      value={opt.value}
                      className={groupOptionClassName}
                    >
                      <span className="truncate">{opt.label}</span>
                      <Check
                        className="size-3.5 opacity-0 transition-opacity group-data-[pressed]:opacity-100"
                        aria-hidden="true"
                      />
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
                  className="mt-2 h-9 w-full justify-start rounded-md px-3 text-xs text-muted-foreground"
                >
                  {copy.clear}
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
