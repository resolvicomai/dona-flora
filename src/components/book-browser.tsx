'use client'

import { useMemo } from 'react'
import { useQueryStates } from 'nuqs'

import type { Book } from '@/lib/books/schema'
import type { AppLanguage } from '@/lib/i18n/app-language'
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
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
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

type BrowseCopy = {
  collectionBody: string
  collectionCount: (count: number) => string
  collectionEyebrow: string
  emptyBody: string
  emptyTitle: string
  firstBookCta: string
  heroBody: string
  heroEyebrow: string
  heroTitle: string
  readingLabel: string
  readingValue: string
  searchLabel: string
  searchValue: string
  summaryCount: (count: number) => string
  summaryEyebrow: string
}

const BROWSE_COPY: Record<AppLanguage, BrowseCopy> = {
  'pt-BR': {
    collectionBody: 'Os livros que fazem sentido para este recorte da sua biblioteca.',
    collectionCount: (count) =>
      `${count} ${count === 1 ? 'titulo em foco' : 'titulos em foco'}`,
    collectionEyebrow: 'Acervo',
    emptyBody:
      'Adicione o primeiro livro por ISBN ou titulo, e a Dona Flora passa a ler o seu contexto junto com voce.',
    emptyTitle: 'Sua biblioteca comeca aqui',
    firstBookCta: 'Adicionar primeiro livro',
    heroBody:
      'Busque, filtre e retome livros sem ruido, enquanto a Dona Flora acompanha o contexto da sua leitura.',
    heroEyebrow: 'Biblioteca pessoal',
    heroTitle: 'Seu acervo merece silencio, clareza e presenca.',
    readingLabel: 'Leitura',
    readingValue: 'Com contexto',
    searchLabel: 'Busca',
    searchValue: 'Tempo real',
    summaryCount: (count) =>
      count === 1 ? 'titulo catalogado' : 'titulos catalogados',
    summaryEyebrow: 'Panorama',
  },
  en: {
    collectionBody: 'The books that matter in this slice of your library.',
    collectionCount: (count) =>
      `${count} ${count === 1 ? 'title in focus' : 'titles in focus'}`,
    collectionEyebrow: 'Collection',
    emptyBody:
      'Add the first book by ISBN or title, and Dona Flora starts learning your reading context with you.',
    emptyTitle: 'Your library starts here',
    firstBookCta: 'Add first book',
    heroBody:
      'Search, filter, and return to books with less friction, while Dona Flora keeps track of your reading context.',
    heroEyebrow: 'Personal library',
    heroTitle: 'Your library deserves calm, clarity, and presence.',
    readingLabel: 'Reading',
    readingValue: 'With context',
    searchLabel: 'Search',
    searchValue: 'Real time',
    summaryCount: (count) =>
      count === 1 ? 'cataloged title' : 'cataloged titles',
    summaryEyebrow: 'Overview',
  },
  es: {
    collectionBody: 'Los libros que importan en este recorte de tu biblioteca.',
    collectionCount: (count) =>
      `${count} ${count === 1 ? 'titulo en foco' : 'titulos en foco'}`,
    collectionEyebrow: 'Coleccion',
    emptyBody:
      'Agrega el primer libro por ISBN o titulo y Dona Flora empieza a leer tu contexto junto contigo.',
    emptyTitle: 'Tu biblioteca empieza aqui',
    firstBookCta: 'Agregar primer libro',
    heroBody:
      'Busca, filtra y retoma libros con menos ruido, mientras Dona Flora acompana el contexto de tu lectura.',
    heroEyebrow: 'Biblioteca personal',
    heroTitle: 'Tu biblioteca merece calma, claridad y presencia.',
    readingLabel: 'Lectura',
    readingValue: 'Con contexto',
    searchLabel: 'Busqueda',
    searchValue: 'Tiempo real',
    summaryCount: (count) =>
      count === 1 ? 'titulo catalogado' : 'titulos catalogados',
    summaryEyebrow: 'Panorama',
  },
  'zh-CN': {
    collectionBody: '这个视图里，留下的是此刻最重要的书。',
    collectionCount: (count) => `${count} 本当前聚焦`,
    collectionEyebrow: '书库',
    emptyBody: '按 ISBN 或书名添加第一本书，Dona Flora 就会开始理解你的阅读脉络。',
    emptyTitle: '你的书库从这里开始',
    firstBookCta: '添加第一本书',
    heroBody: '更轻松地搜索、筛选和重拾书籍，让 Dona Flora 始终理解你的阅读语境。',
    heroEyebrow: '个人书库',
    heroTitle: '你的书库值得更安静、更清晰、更从容。',
    readingLabel: '阅读',
    readingValue: '有上下文',
    searchLabel: '搜索',
    searchValue: '实时',
    summaryCount: () => '已整理图书',
    summaryEyebrow: '概览',
  },
}

export function BookBrowser({ initialBooks }: BookBrowserProps) {
  const { locale } = useAppLanguage()
  const copy = BROWSE_COPY[locale]
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
    <div className="page-frame flex min-h-0 flex-1 flex-col gap-7 pt-8 md:gap-9 md:pt-11">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-center">
        <div className="space-y-5 md:space-y-6">
          <p className="eyebrow">{copy.heroEyebrow}</p>
          <h1 className="editorial-title max-w-3xl text-foreground">
            {copy.heroTitle}
          </h1>
          <p className="body-copy max-w-2xl">{copy.heroBody}</p>
        </div>

        <div className="panel-quiet rounded-[2rem] p-6 md:p-7">
          <p className="eyebrow">{copy.summaryEyebrow}</p>
          <p className="mt-4 text-5xl font-semibold tracking-[-0.08em] text-foreground tabular-nums">
            {initialBooks.length}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {copy.summaryCount(initialBooks.length)}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[1.4rem] border border-hairline bg-background/40 px-3.5 py-3.5">
              <p className="eyebrow">{copy.searchLabel}</p>
              <p className="mt-2 text-sm font-medium tracking-[-0.02em] text-foreground">
                {copy.searchValue}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-hairline bg-background/40 px-3.5 py-3.5">
              <p className="eyebrow">{copy.readingLabel}</p>
              <p className="mt-2 text-sm font-medium tracking-[-0.02em] text-foreground">
                {copy.readingValue}
              </p>
            </div>
          </div>
        </div>
      </section>

      <FilterBar
        state={state}
        onChange={(patch) => setState(patch)}
        onReset={clearAll}
        view={view}
        onViewChange={setView}
        genres={genres}
      />

      <div className="flex min-h-0 flex-1 flex-col pb-10">
        {initialBooks.length === 0 ? (
          <section className="flex flex-1 items-center justify-center py-10 text-center">
            <div className="panel-solid flex w-full max-w-xl flex-col items-center gap-5 rounded-[2rem] px-6 py-10">
              <EmptyStateBooksIllustration />
              <div className="flex flex-col gap-3">
                <h2 className="section-title text-foreground">{copy.emptyTitle}</h2>
                <p className="mx-auto max-w-md text-balance text-sm leading-7 text-muted-foreground">
                  {copy.emptyBody}
                </p>
              </div>
              <AddBookDialog triggerLabel={copy.firstBookCta} />
            </div>
          </section>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 lg:mb-6 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
              <div>
                <p className="eyebrow">{copy.collectionEyebrow}</p>
                <p
                  className="mt-2 text-sm text-muted-foreground tabular-nums"
                  aria-live="polite"
                >
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
              <div className="grid grid-cols-2 gap-x-4 gap-y-9 pb-4 md:grid-cols-3 xl:grid-cols-4 xl:gap-y-10">
                {visible.map((book) => (
                  <BookCard key={book._filename ?? book.title} book={book} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3 pb-4">
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
