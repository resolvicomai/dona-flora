'use client'

import type { ReactNode } from 'react'
import { Star } from 'lucide-react'
import type { BookStatus } from '@/lib/books/schema'
import type { SortKey, SortDir } from '@/lib/books/search-params'
import { STATUS_OPTIONS } from '@/lib/books/status-labels'
import { FilterChipGroup } from '@/components/filter-chip-group'
import { SearchInput } from '@/components/search-input'
import { SortSelect } from '@/components/sort-select'
import { ViewToggle } from '@/components/view-toggle'

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
  view: 'grid' | 'list'
  onViewChange: (next: 'grid' | 'list') => void
  genres: Array<{ key: string; label: string }>
}

type RatingValue = '1' | '2' | '3' | '4' | '5'

// Rating chips: exact-match semantic per RESEARCH A2 (not "N or more").
// Star icon on the leading slot reuses the StarRating yellow token — not a new accent.
const RATING_OPTIONS: ReadonlyArray<{
  value: RatingValue
  label: string
  leading: ReactNode
}> = [
  {
    value: '5',
    label: '5 estrelas',
    leading: (
      <Star
        className="h-3 w-3 fill-yellow-400 text-yellow-400"
        aria-hidden="true"
      />
    ),
  },
  {
    value: '4',
    label: '4 estrelas',
    leading: (
      <Star
        className="h-3 w-3 fill-yellow-400 text-yellow-400"
        aria-hidden="true"
      />
    ),
  },
  {
    value: '3',
    label: '3 estrelas',
    leading: (
      <Star
        className="h-3 w-3 fill-yellow-400 text-yellow-400"
        aria-hidden="true"
      />
    ),
  },
  {
    value: '2',
    label: '2 estrelas',
    leading: (
      <Star
        className="h-3 w-3 fill-yellow-400 text-yellow-400"
        aria-hidden="true"
      />
    ),
  },
  {
    value: '1',
    label: '1 estrela',
    leading: (
      <Star
        className="h-3 w-3 fill-yellow-400 text-yellow-400"
        aria-hidden="true"
      />
    ),
  },
] as const

/**
 * Sticky filter bar composing SearchInput + three FilterChipGroups
 * (status / rating / genre) + SortSelect + ViewToggle.
 *
 * Layout (UI-SPEC §Sticky bar composition):
 * - Mobile (base): two rows — row 1 = search + sort + toggle, row 2 = chips
 *   with `overflow-x-auto` horizontal scroll (D-08).
 * - Desktop (md+): single-row flex; search on the left, chip cluster in the
 *   middle, sort+view on the right (`md:ml-auto md:order-last`).
 *
 * Sticky stacking:
 * - Header is `sticky top-0 z-10` in page.tsx (will need to bump to z-20 when
 *   this FilterBar is mounted). FilterBar sits below at `top-[57px] z-10`.
 * - Background treatment matches the header: `bg-zinc-950/80 backdrop-blur-sm
 *   border-b border-zinc-800` for a unified sticky surface.
 *
 * State flow: presentational only. All state is owned by the parent
 * (BookBrowser, Plan 05); this component emits `onChange(patch)` and
 * `onViewChange(mode)`. No URL, localStorage, or fetch coupling here.
 */
export function FilterBar({
  state,
  onChange,
  view,
  onViewChange,
  genres,
}: FilterBarProps) {
  const genreOptions = genres.map((g) => ({ value: g.key, label: g.label }))

  // Explicit cast so FilterChipGroup<T extends string> infers T = '1'|...|'5'
  // rather than generic `string`; query.ts FilterState stores rating as number[],
  // so we stringify for the chip group and parse back on change.
  const ratingStringValue = state.rating.map(String) as ('1' | '2' | '3' | '4' | '5')[]

  return (
    <div className="sticky top-[57px] z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      <div className="flex flex-col gap-3 px-4 py-3 md:px-8 md:flex-row md:items-center md:gap-4 md:py-2">
        {/* Row 1 on mobile / unwrapped into flex row on desktop:
            search + sort + view-toggle. `md:contents` lifts children into the
            parent flex so `md:ml-auto md:order-last` can push sort/view right
            of the chip cluster. */}
        <div className="flex items-center gap-2 md:contents">
          <SearchInput
            value={state.q}
            onChange={(q) => onChange({ q })}
            className="flex-1 md:flex-none"
          />
          <div className="flex items-center gap-2 md:ml-auto md:order-last">
            <SortSelect
              sort={state.sort}
              dir={state.dir}
              onChange={(sort, dir) => onChange({ sort, dir })}
            />
            <ViewToggle value={view} onChange={onViewChange} />
          </div>
        </div>

        {/* Row 2 on mobile / middle segment on desktop: chip groups.
            overflow-x-auto on mobile (D-08); md:flex-1 + md:min-w-0 lets the
            chip container stretch and shrink safely in the desktop row. */}
        <div
          className="flex gap-3 overflow-x-auto md:flex-1 md:min-w-0"
          role="group"
          aria-label="Filtros"
        >
          <FilterChipGroup<BookStatus>
            label="Filtrar por status"
            options={STATUS_OPTIONS}
            value={state.status}
            onValueChange={(status) => onChange({ status })}
          />
          <FilterChipGroup<RatingValue>
            label="Filtrar por nota"
            options={RATING_OPTIONS}
            value={ratingStringValue}
            onValueChange={(next) =>
              onChange({
                rating: next
                  .map((n) => Number(n))
                  .filter((n) => !Number.isNaN(n)),
              })
            }
          />
          {genres.length > 0 && (
            <FilterChipGroup<string>
              label="Filtrar por gênero"
              options={genreOptions}
              value={state.genre}
              onValueChange={(genre) => onChange({ genre })}
            />
          )}
        </div>
      </div>
    </div>
  )
}
