'use client'

import { useMemo } from 'react'
import { useQueryStates } from 'nuqs'

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

import { AddBookDialog } from '@/components/add-book-dialog'
import { BookCard } from '@/components/book-card'
import { BookRow } from '@/components/book-row'
import { EmptyResults } from '@/components/empty-results'
import { EmptyStateBooksIllustration } from '@/components/empty-state-books-illustration'
import { FilterBar } from '@/components/filter-bar'

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
  const genres = useMemo(() => extractGenres(initialBooks), [initialBooks])

  const filteredBooks = useMemo(
    () =>
      applyFilters(initialBooks, {
        status: state.status,
        rating: state.rating,
        genre: state.genre,
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FilterBar
        state={state}
        onChange={(patch) => setState(patch)}
        onReset={clearAll}
        view={view}
        onViewChange={setView}
        genres={genres}
      />

      <div className="flex min-h-0 flex-1 flex-col px-4 py-6 md:px-6">
        {initialBooks.length === 0 ? (
          <section className="flex flex-1 items-center justify-center py-10 text-center">
            <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-card/80 px-6 py-8 shadow-mac-sm">
              <EmptyStateBooksIllustration />
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Seu acervo está esperando
                </h2>
                <p className="text-balance text-sm leading-6 text-muted-foreground">
                  Adicione o primeiro livro por ISBN ou título e a Dona Flora começa a conhecer você.
                </p>
              </div>
              <AddBookDialog triggerLabel="Adicionar primeiro livro" />
            </div>
          </section>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground tabular-nums" aria-live="polite">
              {visible.length} livro{visible.length !== 1 ? 's' : ''} na biblioteca
            </p>

            {visible.length === 0 && hasActiveFilters ? (
              <EmptyResults onClear={clearAll} />
            ) : view === 'grid' ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
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
          </>
        )}
      </div>
    </div>
  )
}
