'use client'

import { useMemo } from 'react'
import { useQueryStates } from 'nuqs'
import { BookOpen } from 'lucide-react'

import type { Book } from '@/lib/books/schema'
import { browseSearchParams } from '@/lib/books/search-params'
import {
  applyFilters,
  applySearch,
  applySort,
  createFuse,
  extractGenres,
} from '@/lib/books/query'
import { useLocalStorage } from '@/lib/use-local-storage'

import { FilterBar } from '@/components/filter-bar'
import { BookCard } from '@/components/book-card'
import { BookRow } from '@/components/book-row'
import { EmptyResults } from '@/components/empty-results'
import { AddBookDialog } from '@/components/add-book-dialog'

interface BookBrowserProps {
  initialBooks: Book[]
}

const VIEW_VALUES = ['grid', 'list'] as const
type ViewMode = (typeof VIEW_VALUES)[number]

export function BookBrowser({ initialBooks }: BookBrowserProps) {
  const [state, setState] = useQueryStates(browseSearchParams, {
    history: 'replace',
    shallow: true,
    scroll: false,
  })
  // D-21: localStorage preference applied post-hydration; brief reflow accepted for personal app (see RESEARCH Pitfall 2).
  const [view, setView] = useLocalStorage<ViewMode>(
    'dona-flora:view-mode',
    'grid',
    VIEW_VALUES,
  )

  const fuse = useMemo(() => createFuse(initialBooks), [initialBooks])
  // D-10: Genre list re-extracts whenever initialBooks changes (router.refresh() after AddBookDialog save).
  const genres = useMemo(() => extractGenres(initialBooks), [initialBooks])

  // Three chained useMemos so each stage recomputes only when its own deps change (Checker I-8):
  const filteredBooks = useMemo(
    () =>
      applyFilters(initialBooks, {
        status: state.status,
        rating: state.rating,
        genre: state.genre,
        // q/sort/dir unused by applyFilters but required by FilterState shape
        q: '',
        sort: state.sort,
        dir: state.dir,
      }),
    [initialBooks, state.status, state.rating, state.genre, state.sort, state.dir],
  )
  const searchedBooks = useMemo(
    () => applySearch(fuse, filteredBooks, state.q),
    [filteredBooks, fuse, state.q],
  )
  const visible = useMemo(
    () => applySort(searchedBooks, state.sort, state.dir),
    [searchedBooks, state.sort, state.dir],
  )

  const hasActiveFilters =
    state.q.trim() !== '' ||
    state.status.length > 0 ||
    state.rating.length > 0 ||
    state.genre.length > 0

  const clearAll = () => {
    setState({
      status: [],
      rating: [],
      genre: [],
      q: '',
      sort: 'added_at',
      dir: 'desc',
    })
  }

  // Biblioteca-vazia empty state (migrated from page.tsx)
  if (initialBooks.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <BookOpen className="h-16 w-16 text-zinc-700" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-zinc-100">
          Sua biblioteca está vazia
        </h2>
        <p className="max-w-sm text-sm text-zinc-400">
          Adicione seu primeiro livro para começar a catalogar sua coleção.
        </p>
        <AddBookDialog triggerLabel="Adicionar primeiro livro" />
      </div>
    )
  }

  return (
    <>
      <FilterBar
        state={state}
        onChange={(patch) => setState(patch)}
        view={view}
        onViewChange={setView}
        genres={genres}
      />

      <div className="flex-1 px-4 py-6 md:px-8">
        <p className="mb-4 text-sm text-zinc-400" aria-live="polite">
          {visible.length} livro{visible.length !== 1 ? 's' : ''} na biblioteca
        </p>

        {visible.length === 0 && hasActiveFilters ? (
          <EmptyResults onClear={clearAll} />
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {visible.map((book) => (
              <BookCard key={book._filename ?? book.title} book={book} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visible.map((book) => (
              <BookRow key={book._filename ?? book.title} book={book} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
