'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { useQueryStates } from 'nuqs'

import type { Book } from '@/lib/books/schema'
import type { AppLanguage } from '@/lib/i18n/app-language'
import { browseSearchParams } from '@/lib/books/search-params'
import { applyFilters, applySearch, applySort, createFuse, extractGenres } from '@/lib/books/query'
import { useLocalStorage } from '@/lib/use-local-storage'

import { AddBookDialog } from '@/components/add-book-dialog'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { BookCard } from '@/components/book-card'
import { BookRow } from '@/components/book-row'
import { BulkEditBooksDialog } from '@/components/bulk-edit-books-dialog'
import { Button } from '@/components/ui/button'
import { EmptyResults } from '@/components/empty-results'
import { EmptyStateBooksIllustration } from '@/components/empty-state-books-illustration'
import { FilterBar } from '@/components/filter-bar'
import { LibraryWatchRefresh } from '@/components/library-watch-refresh'

interface BookBrowserProps {
  initialBooks: Book[]
  onboarding?: ReactNode
}

const VIEW_VALUES = ['grid', 'list'] as const
type ViewMode = (typeof VIEW_VALUES)[number]

type BrowseCopy = {
  collectionBody: string
  collectionCount: (count: number) => string
  collectionEyebrow: string
  connectFolderCta: string
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
  startCardBody: string
  startHints: Array<{
    body: string
    index: string
    title: string
  }>
  summaryCount: (count: number) => string
  summaryEyebrow: string
}

function getBookSlug(book: Book) {
  return book._filename?.replace('.md', '') ?? ''
}

const BROWSE_COPY: Record<AppLanguage, BrowseCopy> = {
  'pt-BR': {
    collectionBody: 'Os livros que fazem sentido para este recorte da sua biblioteca.',
    collectionCount: (count) => `${count} ${count === 1 ? 'título em foco' : 'títulos em foco'}`,
    collectionEyebrow: 'Acervo',
    connectFolderCta: 'Conectar pasta',
    emptyBody:
      'Adicione o primeiro livro por ISBN ou título, e a Dona Flora passa a ler o seu contexto junto com você.',
    emptyTitle: 'Sua biblioteca começa aqui',
    firstBookCta: 'Adicionar primeiro livro',
    heroBody:
      'Busque, filtre e retome livros sem ruído, enquanto a Dona Flora acompanha o contexto da sua leitura.',
    heroEyebrow: 'Biblioteca pessoal',
    heroTitle: 'Seu acervo merece silêncio, clareza e presença.',
    readingLabel: 'Leitura',
    readingValue: 'Com contexto',
    searchLabel: 'Busca',
    searchValue: 'Tempo real',
    startCardBody:
      'Nenhum título catalogado ainda. O primeiro passo é conectar sua pasta ou adicionar um livro manualmente.',
    startHints: [
      {
        body: 'Markdown no Obsidian ou em uma pasta local.',
        index: '01',
        title: 'Fonte',
      },
      {
        body: 'Notas, status e highlights entram na conversa.',
        index: '02',
        title: 'Contexto',
      },
      {
        body: 'Você cataloga aos poucos, sem depender de planilha.',
        index: '03',
        title: 'Ritmo',
      },
    ],
    summaryCount: (count) => (count === 1 ? 'título catalogado' : 'títulos catalogados'),
    summaryEyebrow: 'Panorama',
  },
  en: {
    collectionBody: 'The books that matter in this slice of your library.',
    collectionCount: (count) => `${count} ${count === 1 ? 'title in focus' : 'titles in focus'}`,
    collectionEyebrow: 'Collection',
    connectFolderCta: 'Connect folder',
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
    startCardBody:
      'No titles cataloged yet. Start by connecting your folder or adding a book manually.',
    startHints: [
      {
        body: 'Markdown in Obsidian or in a local folder.',
        index: '01',
        title: 'Source',
      },
      {
        body: 'Notes, status, and highlights become chat context.',
        index: '02',
        title: 'Context',
      },
      {
        body: 'Catalog gradually, without turning this into a spreadsheet.',
        index: '03',
        title: 'Pace',
      },
    ],
    summaryCount: (count) => (count === 1 ? 'cataloged title' : 'cataloged titles'),
    summaryEyebrow: 'Overview',
  },
  es: {
    collectionBody: 'Los libros que importan en este recorte de tu biblioteca.',
    collectionCount: (count) => `${count} ${count === 1 ? 'título en foco' : 'títulos en foco'}`,
    collectionEyebrow: 'Coleccion',
    connectFolderCta: 'Conectar carpeta',
    emptyBody:
      'Agrega el primer libro por ISBN o título y Dona Flora empieza a leer tu contexto junto contigo.',
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
    startCardBody:
      'Todavía no hay títulos catalogados. Empieza conectando tu carpeta o agregando un libro manualmente.',
    startHints: [
      {
        body: 'Markdown en Obsidian o en una carpeta local.',
        index: '01',
        title: 'Fuente',
      },
      {
        body: 'Notas, estado y destacados entran en la conversación.',
        index: '02',
        title: 'Contexto',
      },
      {
        body: 'Catalogas de a poco, sin depender de una planilla.',
        index: '03',
        title: 'Ritmo',
      },
    ],
    summaryCount: (count) => (count === 1 ? 'título catalogado' : 'títulos catalogados'),
    summaryEyebrow: 'Panorama',
  },
  'zh-CN': {
    collectionBody: '这个视图里，留下的是此刻最重要的书。',
    collectionCount: (count) => `${count} 本当前聚焦`,
    collectionEyebrow: '书库',
    connectFolderCta: '连接文件夹',
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
    startCardBody: '还没有整理图书。先连接书籍文件夹，或手动添加一本书。',
    startHints: [
      {
        body: 'Obsidian 或本地文件夹中的 Markdown。',
        index: '01',
        title: '来源',
      },
      {
        body: '笔记、状态和摘录会进入对话上下文。',
        index: '02',
        title: '上下文',
      },
      {
        body: '可以慢慢整理，不必变成表格工程。',
        index: '03',
        title: '节奏',
      },
    ],
    summaryCount: () => '已整理图书',
    summaryEyebrow: '概览',
  },
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

          {onboarding}
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
                  <p className="mt-4 font-mono text-5xl font-semibold tracking-normal text-foreground tabular-nums">
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

          {onboarding}

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
            <p className="eyebrow">Ações do acervo</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectionMode
                ? `${selectedSlugs.length} livro(s) selecionado(s).`
                : 'Ative a seleção para alterar vários livros de uma vez.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={toggleSelectionMode}
              type="button"
              variant={selectionMode ? 'outline' : 'secondary'}
            >
              {selectionMode ? 'Sair da seleção' : 'Selecionar livros'}
            </Button>
            {selectionMode ? (
              <>
                <Button
                  disabled={visibleSlugs.length === 0}
                  onClick={selectVisibleBooks}
                  type="button"
                  variant="outline"
                >
                  Selecionar visíveis
                </Button>
                <Button
                  disabled={selectedSlugs.length === 0}
                  onClick={clearSelection}
                  type="button"
                  variant="ghost"
                >
                  Limpar
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
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 pb-4 md:grid-cols-3 xl:grid-cols-4 xl:gap-y-10">
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

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-mono text-xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function StartHint({ body, index, title }: { body: string; index: string; title: string }) {
  return (
    <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3">
      <span className="font-mono text-xs leading-6 text-muted-foreground">{index}</span>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
      </div>
    </div>
  )
}
