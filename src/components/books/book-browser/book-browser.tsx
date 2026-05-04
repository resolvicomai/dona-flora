'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQueryStates } from 'nuqs'

import type { Book } from '@/lib/books/schema'
import { browseSearchParams } from '@/lib/books/search-params'
import { applyFilters, applySearch, applySort, createFuse, extractGenres } from '@/lib/books/query'
import { useLocalStorage } from '@/lib/use-local-storage'

import { AddBookDialog } from '@/components/books/add-book-dialog'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { BookCard } from '@/components/books/book-card'
import { BookRow } from '@/components/books/book-row'
import { BulkEditBooksDialog } from '@/components/books/bulk-edit-books-dialog'
import { Button } from '@/components/ui/button'
import { EmptyResults } from '@/components/empty-results'
import { EmptyStateBooksIllustration } from '@/components/books/empty-state-books-illustration'
import { FilterBar } from '@/components/filters/filter-bar'
import { LibraryWatchRefresh } from '@/components/library-watch-refresh'
import {
  OnboardingChecklist,
  type OnboardingChecklistProps,
} from '@/components/onboarding-checklist'
import { VIEW_VALUES, type ViewMode } from './constants'
import { BROWSE_COPY } from './copy'
import { StartHint } from './start-hint'
import { SummaryMetric } from './summary-metric'

interface BookBrowserProps {
  initialBooks: Book[]
  onboarding?: OnboardingChecklistProps
}

function getBookSlug(book: Book) {
  return book._filename?.replace('.md', '') ?? ''
}

export function BookBrowser({ initialBooks, onboarding }: BookBrowserProps) {
  const { locale } = useAppLanguage()
  const copy = BROWSE_COPY[locale]
  const [state, setState] = useQueryStates(browseSearchParams, {
    history: 'replace',
    shallow: true,
    scroll: false,
  })
  // D-21: localStorage preference applied post-hydration; brief reflow accepted for personal app (see RESEARCH Pitfall 2).
  const [view, setView] = useLocalStorage<ViewMode>('dona-flora:view-mode', 'grid', VIEW_VALUES)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([])

  const fuse = useMemo(() => createFuse(initialBooks), [initialBooks])
  const genres = useMemo(() => extractGenres(initialBooks), [initialBooks])
  const statusSummary = useMemo(
    () => ({
      abandoned: initialBooks.filter((book) => book.status === 'abandonado').length,
      reading: initialBooks.filter((book) => book.status === 'lendo').length,
      read: initialBooks.filter((book) => book.status === 'lido').length,
      want: initialBooks.filter((book) => book.status === 'quero-ler').length,
    }),
    [initialBooks],
  )

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
  const visibleSlugs = useMemo(() => visible.map(getBookSlug).filter(Boolean), [visible])
  const selectedSlugSet = useMemo(() => new Set(selectedSlugs), [selectedSlugs])

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

  function toggleSelectionMode() {
    if (selectionMode) {
      setSelectedSlugs([])
    }
    setSelectionMode(!selectionMode)
  }

  function handleBookSelection(slug: string, selected: boolean) {
    setSelectedSlugs((current) => {
      const set = new Set(current)
      if (selected) {
        set.add(slug)
      } else {
        set.delete(slug)
      }
      return Array.from(set)
    })
  }

  function selectVisibleBooks() {
    setSelectedSlugs((current) => {
      const set = new Set(current)
      for (const slug of visibleSlugs) set.add(slug)
      return Array.from(set)
    })
  }

  function clearSelection() {
    setSelectedSlugs([])
  }

  function completeBulkEdit() {
    setSelectedSlugs([])
    setSelectionMode(false)
  }

  return (
    <div className="page-frame flex min-h-0 flex-1 flex-col gap-7 pt-8 md:gap-9 md:pt-11">
      <LibraryWatchRefresh />

      {initialBooks.length === 0 ? (
        <>
          <section className="library-start-shell grid gap-8 px-5 py-8 md:px-8 md:py-10 xl:grid-cols-[minmax(0,1fr)_28rem] xl:items-center">
            <div className="max-w-3xl">
              <p className="eyebrow">{copy.heroEyebrow}</p>
              <h1 className="editorial-title mt-5 max-w-3xl text-foreground">{copy.emptyTitle}.</h1>
              <p className="body-copy mt-5 max-w-xl">{copy.emptyBody}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <AddBookDialog triggerLabel={copy.firstBookCta} />
                <Button render={<Link href="/settings?panel=library" />} variant="outline">
                  {copy.connectFolderCta}
                </Button>
              </div>
            </div>

            <aside className="library-start-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">{copy.summaryEyebrow}</p>
                  <p className="mt-4 font-mono text-6xl font-semibold leading-none tracking-normal text-foreground tabular-nums">
                    0
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {copy.startCardBody}
                  </p>
                </div>
                <EmptyStateBooksIllustration className="mt-3 h-20 w-28 opacity-70" />
              </div>
              <div className="mt-6 grid gap-3 border-t border-hairline pt-5">
                {copy.startHints.map((hint) => (
                  <StartHint
                    body={hint.body}
                    index={hint.index}
                    key={hint.index}
                    title={hint.title}
                  />
                ))}
              </div>
            </aside>
          </section>

          {onboarding ? <OnboardingChecklist {...onboarding} /> : null}
        </>
      ) : (
        <>
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-end">
            <div className="space-y-4 md:space-y-5">
              <p className="eyebrow">{copy.heroEyebrow}</p>
              <h1 className="editorial-title max-w-3xl text-foreground">{copy.heroTitle}</h1>
              <p className="body-copy max-w-2xl">{copy.heroBody}</p>
            </div>

            <div className="library-summary-card p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">{copy.summaryEyebrow}</p>
                  <p className="mt-4 font-mono text-4xl font-semibold tracking-normal text-foreground tabular-nums sm:text-5xl">
                    {initialBooks.length}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {copy.summaryCount(initialBooks.length)}
                  </p>
                </div>
                <AddBookDialog />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-hairline pt-4 text-sm">
                <SummaryMetric label="lendo" value={statusSummary.reading} />
                <SummaryMetric label="quero ler" value={statusSummary.want} />
                <SummaryMetric label="lidos" value={statusSummary.read} />
                <SummaryMetric label="abandonados" value={statusSummary.abandoned} />
              </div>
            </div>
          </section>

          {onboarding ? <OnboardingChecklist {...onboarding} /> : null}

          <FilterBar
            state={state}
            onChange={(patch) => setState(patch)}
            onReset={clearAll}
            view={view}
            onViewChange={setView}
            genres={genres}
          />
        </>
      )}

      {initialBooks.length > 0 ? (
        <div className="brand-toolbar flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5">
          <div>
            <p className="eyebrow">{copy.selectionEyebrow}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectionMode
                ? copy.selectionActiveBody(selectedSlugs.length)
                : copy.selectionInactiveBody}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={toggleSelectionMode}
              type="button"
              variant={selectionMode ? 'outline' : 'secondary'}
            >
              {selectionMode ? copy.exitSelection : copy.enterSelection}
            </Button>
            {selectionMode ? (
              <>
                <Button
                  disabled={visibleSlugs.length === 0}
                  onClick={selectVisibleBooks}
                  type="button"
                  variant="outline"
                >
                  {copy.selectVisible}
                </Button>
                <Button
                  disabled={selectedSlugs.length === 0}
                  onClick={clearSelection}
                  type="button"
                  variant="ghost"
                >
                  {copy.clearSelection}
                </Button>
                <BulkEditBooksDialog onComplete={completeBulkEdit} selectedSlugs={selectedSlugs} />
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {initialBooks.length > 0 ? (
        <div className="flex min-h-0 flex-1 flex-col pb-10">
          <div className="mb-4 flex flex-col gap-3 lg:mb-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
            <div>
              <p className="eyebrow">{copy.collectionEyebrow}</p>
              <p className="mt-2 text-sm text-muted-foreground tabular-nums" aria-live="polite">
                {copy.collectionCount(visible.length)}
              </p>
            </div>
            <p className="max-w-md text-sm leading-7 text-muted-foreground">
              {copy.collectionBody}
            </p>
          </div>

          {visible.length === 0 && hasActiveFilters ? (
            <EmptyResults onClear={clearAll} />
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-7 pb-4 sm:gap-x-4 sm:gap-y-9 md:grid-cols-3 xl:grid-cols-4 xl:gap-y-10">
              {visible.map((book) => (
                <BookCard
                  book={book}
                  key={book._filename ?? book.title}
                  locale={locale}
                  onSelectionChange={handleBookSelection}
                  selectable={selectionMode}
                  selected={selectedSlugSet.has(getBookSlug(book))}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3 pb-4">
              {visible.map((book) => (
                <BookRow
                  book={book}
                  key={book._filename ?? book.title}
                  locale={locale}
                  onSelectionChange={handleBookSelection}
                  selectable={selectionMode}
                  selected={selectedSlugSet.has(getBookSlug(book))}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
