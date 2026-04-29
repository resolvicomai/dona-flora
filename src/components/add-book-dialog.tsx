'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Search } from 'lucide-react'

import { BookCover } from '@/components/book-cover'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BookLanguageBadge } from '@/components/book-language-badge'

import type { BookSearchResult } from '@/lib/api/google-books'
import { dedupeBooks } from '@/lib/api/dedupe'
import {
  normalizeBookLanguageFilter,
  type BookLanguageFilter,
} from '@/lib/books/language'
import { getStatusLabel, getStatusOptions } from '@/lib/books/status-labels'
import type { AppLanguage } from '@/lib/i18n/app-language'

type Step = 'search' | 'results' | 'preview' | 'manual' | 'saving'

const BOOK_LANGUAGE_FILTER_COPY: Record<
  AppLanguage,
  {
    all: string
    label: string
  }
> = {
  'pt-BR': {
    all: 'Todos',
    label: 'Idioma do livro',
  },
  en: {
    all: 'All',
    label: 'Book language',
  },
  es: {
    all: 'Todos',
    label: 'Idioma del libro',
  },
  'zh-CN': {
    all: '全部',
    label: '图书语言',
  },
}

const BOOK_LANGUAGE_FILTER_OPTIONS: Array<{
  label: string
  value: BookLanguageFilter
}> = [
  { label: 'PT-BR', value: 'pt-BR' },
  { label: 'EN', value: 'en' },
  { label: 'ES', value: 'es' },
  { label: '中文', value: 'zh-CN' },
]

type AddBookCopy = {
  add: string
  adding: string
  andMoreAuthors: string
  authorLabel: string
  authorPlaceholder: string
  back: string
  coverLabel: string
  coverSourceExternal: string
  dialogTitle: string
  manualTitle: string
  metadataSource: {
    googleBooks: string
    openLibrary: string
    visionImport: string
  }
  noResults: string
  notFoundManual: string
  photoBody: string
  photoTitle: string
  publisherLabel: string
  readingPhoto: string
  retry: string
  saveError: string
  searchError: string
  searchPlaceholder: string
  sendCover: string
  sourceLabel: string
  statusLabel: string
  synopsisLabel: string
  titleLabel: string
  titlePlaceholder: string
  unableToLoadMore: string
  unableToReadPhoto: string
  unknownAuthor: string
}

const ADD_BOOK_COPY: Record<AppLanguage, AddBookCopy> = {
  'pt-BR': {
    add: 'Adicionar',
    adding: 'Adicionando…',
    andMoreAuthors: 'e +',
    authorLabel: 'Autor',
    authorPlaceholder: 'Autor',
    back: 'Voltar',
    coverLabel: 'Capa',
    coverSourceExternal: 'externa',
    dialogTitle: 'Adicionar livro',
    manualTitle: 'Adicionar manualmente',
    metadataSource: {
      googleBooks: 'Google Books',
      openLibrary: 'Open Library',
      visionImport: 'Foto da capa',
    },
    noResults: 'Nenhum resultado encontrado.',
    notFoundManual: 'Não encontrei meu livro',
    photoBody: 'Opcional: usa visão externa só se você habilitou nas settings.',
    photoTitle: 'Catalogar por foto',
    publisherLabel: 'Editora',
    readingPhoto: 'Lendo foto…',
    retry: 'Tentar novamente',
    saveError: 'Erro ao adicionar livro. Tente novamente.',
    searchError: 'Erro ao buscar. Tente novamente.',
    searchPlaceholder: 'Buscar por título ou ISBN…',
    sendCover: 'Enviar capa',
    sourceLabel: 'Fonte',
    statusLabel: 'Status',
    synopsisLabel: 'Sinopse',
    titleLabel: 'Título do livro',
    titlePlaceholder: 'Título do livro',
    unableToLoadMore: 'Não foi possível carregar mais resultados.',
    unableToReadPhoto: 'Não foi possível ler a foto.',
    unknownAuthor: 'Autor desconhecido',
  },
  en: {
    add: 'Add',
    adding: 'Adding…',
    andMoreAuthors: 'and +',
    authorLabel: 'Author',
    authorPlaceholder: 'Author',
    back: 'Back',
    coverLabel: 'Cover',
    coverSourceExternal: 'external',
    dialogTitle: 'Add book',
    manualTitle: 'Add manually',
    metadataSource: {
      googleBooks: 'Google Books',
      openLibrary: 'Open Library',
      visionImport: 'Cover photo',
    },
    noResults: 'No results found.',
    notFoundManual: 'I cannot find my book',
    photoBody: 'Optional: uses external vision only if you enabled it in settings.',
    photoTitle: 'Catalog from photo',
    publisherLabel: 'Publisher',
    readingPhoto: 'Reading photo…',
    retry: 'Try again',
    saveError: 'Could not add the book. Try again.',
    searchError: 'Search failed. Try again.',
    searchPlaceholder: 'Search by title or ISBN…',
    sendCover: 'Upload cover',
    sourceLabel: 'Source',
    statusLabel: 'Status',
    synopsisLabel: 'Synopsis',
    titleLabel: 'Book title',
    titlePlaceholder: 'Book title',
    unableToLoadMore: 'Could not load more results.',
    unableToReadPhoto: 'Could not read the photo.',
    unknownAuthor: 'Unknown author',
  },
  es: {
    add: 'Agregar',
    adding: 'Agregando…',
    andMoreAuthors: 'y +',
    authorLabel: 'Autor',
    authorPlaceholder: 'Autor',
    back: 'Volver',
    coverLabel: 'Portada',
    coverSourceExternal: 'externa',
    dialogTitle: 'Agregar libro',
    manualTitle: 'Agregar manualmente',
    metadataSource: {
      googleBooks: 'Google Books',
      openLibrary: 'Open Library',
      visionImport: 'Foto de portada',
    },
    noResults: 'No se encontraron resultados.',
    notFoundManual: 'No encontré mi libro',
    photoBody: 'Opcional: usa visión externa solo si la habilitaste en configuración.',
    photoTitle: 'Catalogar por foto',
    publisherLabel: 'Editorial',
    readingPhoto: 'Leyendo foto…',
    retry: 'Intentar de nuevo',
    saveError: 'No se pudo agregar el libro. Inténtalo de nuevo.',
    searchError: 'Error al buscar. Inténtalo de nuevo.',
    searchPlaceholder: 'Buscar por título o ISBN…',
    sendCover: 'Enviar portada',
    sourceLabel: 'Fuente',
    statusLabel: 'Estado',
    synopsisLabel: 'Sinopsis',
    titleLabel: 'Título del libro',
    titlePlaceholder: 'Título del libro',
    unableToLoadMore: 'No se pudieron cargar más resultados.',
    unableToReadPhoto: 'No se pudo leer la foto.',
    unknownAuthor: 'Autor desconocido',
  },
  'zh-CN': {
    add: '添加',
    adding: '添加中…',
    andMoreAuthors: '另 +',
    authorLabel: '作者',
    authorPlaceholder: '作者',
    back: '返回',
    coverLabel: '封面',
    coverSourceExternal: '外部',
    dialogTitle: '添加图书',
    manualTitle: '手动添加',
    metadataSource: {
      googleBooks: 'Google Books',
      openLibrary: 'Open Library',
      visionImport: '封面照片',
    },
    noResults: '没有找到结果。',
    notFoundManual: '找不到我的书',
    photoBody: '可选：仅在设置中启用外部视觉后使用。',
    photoTitle: '通过照片编目',
    publisherLabel: '出版社',
    readingPhoto: '正在读取照片…',
    retry: '重试',
    saveError: '无法添加图书。请重试。',
    searchError: '搜索失败。请重试。',
    searchPlaceholder: '按标题或 ISBN 搜索…',
    sendCover: '上传封面',
    sourceLabel: '来源',
    statusLabel: '状态',
    synopsisLabel: '简介',
    titleLabel: '书名',
    titlePlaceholder: '书名',
    unableToLoadMore: '无法加载更多结果。',
    unableToReadPhoto: '无法读取照片。',
    unknownAuthor: '未知作者',
  },
}

function formatAuthors(authors: string[], copy: AddBookCopy): string {
  if (authors.length === 0) return copy.unknownAuthor
  if (authors.length <= 2) return authors.join(', ')
  return `${authors[0]}, ${authors[1]} ${copy.andMoreAuthors}${authors.length - 2}`
}

function metadataSourceLabel(source: BookSearchResult['source'], copy: AddBookCopy) {
  if (source === 'google-books') return copy.metadataSource.googleBooks
  if (source === 'open-library') return copy.metadataSource.openLibrary
  return copy.metadataSource.visionImport
}

async function getSearchErrorMessage(response: Response, copy: AddBookCopy) {
  const payload = (await response.json().catch(() => null)) as {
    error?: string
  } | null

  return payload?.error ?? copy.searchError
}

interface AddBookDialogProps {
  triggerLabel?: string
}

export function AddBookDialog({ triggerLabel }: AddBookDialogProps) {
  const router = useRouter()
  const { locale } = useAppLanguage()
  const copy = ADD_BOOK_COPY[locale]
  const filterCopy = BOOK_LANGUAGE_FILTER_COPY[locale]
  const statusOptions = getStatusOptions(locale)

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('search')
  const [query, setQuery] = useState('')
  const [bookLanguage, setBookLanguage] = useState<BookLanguageFilter>('all')
  const [results, setResults] = useState<BookSearchResult[]>([])
  const [selected, setSelected] = useState<BookSearchResult | null>(null)
  const [searching, setSearching] = useState(false)
  const [visionImporting, setVisionImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Preview status
  const [previewStatus, setPreviewStatus] = useState<string>('quero-ler')

  // Manual form fields
  const [manualTitle, setManualTitle] = useState('')
  const [manualAuthor, setManualAuthor] = useState('')
  const [manualStatus, setManualStatus] = useState<string>('quero-ler')

  // Pagination state (Phase 3 D-23)
  const [nextStart, setNextStart] = useState(0)
  const [nextPage, setNextPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function resetSearchResults() {
    setResults([])
    setNextStart(0)
    setNextPage(1)
    setHasMore(true)
    setLoadingMore(false)
    setLoadMoreError(null)
  }

  async function runSearch(nextQuery: string, nextLanguage: BookLanguageFilter) {
    setSearching(true)
    try {
      const res = await fetch('/api/books/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: nextQuery,
          ...(nextLanguage === 'all' ? {} : { language: nextLanguage }),
        }),
      })
      if (!res.ok) throw new Error(await getSearchErrorMessage(res, copy))
      const data: BookSearchResult[] = await res.json()
      setResults(data)
      setStep(data.length > 0 ? 'results' : 'search')
      setHasMore(data.length >= 20)
      setNextStart(20)
      setNextPage(2)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : copy.searchError,
      )
    } finally {
      setSearching(false)
    }
  }

  function resetDialog() {
    setStep('search')
    setQuery('')
    setBookLanguage('all')
    setResults([])
    setSelected(null)
    setVisionImporting(false)
    setError(null)
    setPreviewStatus('quero-ler')
    setManualTitle('')
    setManualAuthor('')
    setManualStatus('quero-ler')
    setNextStart(0)
    setNextPage(1)
    setHasMore(true)
    setLoadingMore(false)
    setLoadMoreError(null)
  }

  function handleOpenChange(value: boolean) {
    setOpen(value)
    if (!value) {
      resetDialog()
    }
  }

  function handleQueryChange(value: string) {
    setQuery(value)
    setError(null)
    setLoadMoreError(null)
    resetSearchResults()

    if (timerRef.current) clearTimeout(timerRef.current)

    if (value.length < 3) {
      setStep('search')
      return
    }

    timerRef.current = setTimeout(async () => {
      await runSearch(value, bookLanguage)
    }, 400)
  }

  function handleBookLanguageChange(value: BookLanguageFilter) {
    const nextLanguage = normalizeBookLanguageFilter(value)
    setBookLanguage(nextLanguage)
    setError(null)
    setLoadMoreError(null)
    resetSearchResults()

    if (timerRef.current) clearTimeout(timerRef.current)

    if (query.length < 3) {
      setStep('search')
      return
    }

    timerRef.current = setTimeout(async () => {
      await runSearch(query, nextLanguage)
    }, 200)
  }

  async function fetchMore() {
    if (!hasMore || loadingMore || !query || query.length < 3) return
    setLoadingMore(true)
    setLoadMoreError(null)
    try {
      const res = await fetch('/api/books/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          startIndex: nextStart,
          page: nextPage,
          ...(bookLanguage === 'all' ? {} : { language: bookLanguage }),
        }),
      })
      if (!res.ok) throw new Error(await getSearchErrorMessage(res, copy))
      const data: BookSearchResult[] = await res.json()
      if (data.length === 0) {
        setHasMore(false)
        return
      }
      setResults((prev) => dedupeBooks([...prev, ...data]))
      setNextStart((s) => s + 20)
      setNextPage((p) => p + 1)
      if (data.length < 20) setHasMore(false)
    } catch (err) {
      setLoadMoreError(
        err instanceof Error
          ? err.message
          : copy.unableToLoadMore,
      )
    } finally {
      setLoadingMore(false)
    }
  }

  async function handleVisionImage(file: File | null | undefined) {
    if (!file) return

    setError(null)
    setVisionImporting(true)

    try {
      const body = new FormData()
      body.set('image', file)
      const res = await fetch('/api/books/vision-import', {
        body,
        method: 'POST',
      })
      const payload = (await res.json().catch(() => null)) as {
        candidate?: {
          author?: string[]
          confidence?: number
          publisher?: string
          subtitle?: string
          title?: string
        }
        error?: string
        matches?: BookSearchResult[]
      } | null

      if (!res.ok || !payload?.candidate?.title) {
        throw new Error(payload?.error ?? 'Não foi possível ler a foto.')
      }

      const candidate: BookSearchResult = {
        authors: payload.candidate.author ?? [],
        publisher: payload.candidate.publisher,
        source: 'vision-import',
        subtitle: payload.candidate.subtitle,
        title: payload.candidate.title,
      }

      setResults(dedupeBooks([candidate, ...(payload.matches ?? [])]))
      setSelected(candidate)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.unableToReadPhoto)
    } finally {
      setVisionImporting(false)
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    }
  }

  async function saveBook(bookData: Record<string, unknown>) {
    const previousStep = step
    setStep('saving')
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData),
      })
      if (!res.ok) throw new Error()
      setOpen(false)
      resetDialog()
      router.refresh()
    } catch {
      setError(copy.saveError)
      setStep(previousStep === 'saving' ? 'preview' : previousStep)
    }
  }

  function handleSaveFromPreview() {
    if (!selected) return
    saveBook({
      title: selected.title,
      subtitle: selected.subtitle,
      author: selected.authors,
      isbn: selected.isbn,
      isbn_10: selected.isbn10,
      isbn_13: selected.isbn13,
      publisher: selected.publisher,
      synopsis: selected.synopsis,
      synopsis_source: selected.synopsisSource,
      cover: selected.cover,
      genre: selected.genre,
      year: selected.year,
      language: selected.language,
      status: previewStatus,
    })
  }

  function handleSaveManual() {
    if (!manualTitle.trim() || !manualAuthor.trim()) return
    saveBook({
      title: manualTitle.trim(),
      author: manualAuthor.trim(),
      status: manualStatus,
    })
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore || results.length === 0) return
    const target = sentinelRef.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchMore()
      },
      { rootMargin: '100px' },
    )
    observer.observe(target)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.length, hasMore, loadingMore, query])

  const isSaving = step === 'saving'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          triggerLabel ? (
            <Button className="w-full">
              {triggerLabel}
            </Button>
          ) : (
            <Button aria-label={copy.dialogTitle}>
              <Plus />
              <span className="hidden md:inline">{copy.dialogTitle}</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-semibold tracking-normal text-foreground">
            {step === 'manual' ? copy.manualTitle : copy.dialogTitle}
          </DialogTitle>
        </DialogHeader>

        {/* Search step + Results step */}
        {(step === 'search' || step === 'results' || step === 'saving') && selected === null && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="eyebrow">
                {filterCopy.label}
              </Label>
              <div
                role="group"
                aria-label={filterCopy.label}
                className="flex flex-wrap gap-2"
              >
                <button
                  type="button"
                  aria-pressed={bookLanguage === 'all'}
                  className={`surface-transition inline-flex h-9 items-center justify-center rounded-md border px-3 font-mono text-[0.76rem] font-medium tracking-normal ${
                    bookLanguage === 'all'
                      ? 'border-transparent bg-primary text-primary-foreground shadow-mac-sm'
                      : 'border-hairline bg-surface-elevated text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground'
                  }`}
                  onClick={() => handleBookLanguageChange('all')}
                >
                  {filterCopy.all}
                </button>
                {BOOK_LANGUAGE_FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={bookLanguage === option.value}
                    className={`surface-transition inline-flex h-9 items-center justify-center rounded-md border px-3 font-mono text-[0.76rem] font-medium tracking-normal ${
                      bookLanguage === option.value
                        ? 'border-transparent bg-primary text-primary-foreground shadow-mac-sm'
                        : 'border-hairline bg-surface-elevated text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground'
                    }`}
                    onClick={() => handleBookLanguageChange(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                placeholder={copy.searchPlaceholder}
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="pl-11 pr-10"
              />
              {searching && (
                <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            <div className="brand-inset flex flex-col gap-3 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-foreground">{copy.photoTitle}</p>
                <p className="mt-1">
                  {copy.photoBody}
                </p>
              </div>
              <input
                ref={imageInputRef}
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                className="hidden"
                onChange={(event) => handleVisionImage(event.target.files?.[0])}
                type="file"
              />
              <Button
                disabled={visionImporting}
                onClick={() => imageInputRef.current?.click()}
                type="button"
                variant="outline"
              >
                {visionImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {copy.readingPhoto}
                  </>
                ) : (
                  copy.sendCover
                )}
              </Button>
            </div>

            {/* Error */}
            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* Results */}
            {results.length > 0 && (
              <div className="flex max-h-[50vh] flex-col gap-1 overflow-y-auto pr-1 -mr-1">
                {results.map((book, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelected(book)
                      setStep('preview')
                    }}
                    className="surface-transition brand-panel flex w-full items-start gap-3 p-3 text-left hover:-translate-y-px hover:border-hairline-strong hover:bg-surface-elevated"
                  >
                    <BookCover src={book.cover} alt={book.title} size="sm" />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="line-clamp-2 break-words text-sm font-semibold tracking-normal text-foreground">
                        {book.subtitle ? `${book.title}: ${book.subtitle}` : book.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 break-words text-xs text-muted-foreground">
                        {formatAuthors(book.authors, copy)}
                      </p>
                      <p className="mt-1 line-clamp-1 text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
                        {metadataSourceLabel(book.source, copy)}
                        {book.publisher ? ` • ${book.publisher}` : ''}
                      </p>
                      <BookLanguageBadge language={book.language} />
                    </div>
                  </button>
                ))}
                {hasMore && <div ref={sentinelRef} className="h-4" aria-hidden />}
                {loadingMore && (
                  <div className="flex items-center justify-center py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {loadMoreError && (
                  <div className="flex flex-col items-center gap-2 py-3 text-center">
                    <p className="text-xs text-muted-foreground">{loadMoreError}</p>
                    <button
                      type="button"
                      onClick={fetchMore}
                      className="text-sm text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
                    >
                      {copy.retry}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* No results state */}
            {!searching && query.length >= 3 && results.length === 0 && !error && (
              <p className="text-center text-sm text-muted-foreground">
                {copy.noResults}
              </p>
            )}

            {/* Manual add link */}
            {query.length >= 3 && !searching && (
              <button
                onClick={() => {
                  setError(null)
                  setStep('manual')
                }}
                className="text-center text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
              >
                {copy.notFoundManual}
              </button>
            )}
          </div>
        )}

        {/* Preview step */}
        {step === 'preview' && selected !== null && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <BookCover src={selected.cover} alt={selected.title} size="sm" />
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="line-clamp-3 break-words text-sm font-medium text-foreground">
                  {selected.subtitle
                    ? `${selected.title}: ${selected.subtitle}`
                    : selected.title}
                </p>
                <p className="mt-0.5 line-clamp-2 break-words text-xs text-muted-foreground">
                  {formatAuthors(selected.authors, copy)}
                </p>
                {selected.genre && (
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {selected.genre}
                  </p>
                )}
                {selected.year && (
                  <p className="text-xs text-muted-foreground">{selected.year}</p>
                )}
                <BookLanguageBadge language={selected.language} />
              </div>
            </div>

            <div className="brand-inset grid gap-2 px-4 py-3 text-sm text-muted-foreground">
              <MetadataLine label={copy.sourceLabel} value={metadataSourceLabel(selected.source, copy)} />
              <MetadataLine label={copy.publisherLabel} value={selected.publisher} />
              <MetadataLine label="ISBN-13" value={selected.isbn13} />
              <MetadataLine label="ISBN-10" value={selected.isbn10} />
              <MetadataLine label={copy.synopsisLabel} value={selected.synopsisSource} />
              <MetadataLine label={copy.coverLabel} value={selected.coverSource ?? selected.cover ? selected.coverSource ?? copy.coverSourceExternal : undefined} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="eyebrow">{copy.statusLabel}</Label>
              <Select value={previewStatus} onValueChange={(v) => { if (v) setPreviewStatus(v) }}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v) => getStatusLabel(v, locale)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelected(null)
                  setStep('results')
                  setError(null)
                }}
              >
                {copy.back}
              </Button>
              <Button onClick={handleSaveFromPreview} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {copy.adding}
                  </>
                ) : (
                  copy.add
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Saving state (from preview) */}
        {step === 'saving' && selected !== null && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <BookCover src={selected.cover} alt={selected.title} size="sm" />
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="line-clamp-3 break-words text-sm font-medium text-foreground">
                  {selected.title}
                </p>
                <p className="mt-0.5 line-clamp-2 break-words text-xs text-muted-foreground">
                  {formatAuthors(selected.authors, copy)}
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
                {copy.adding}
              </Button>
            </div>
          </div>
        )}

        {/* Manual form */}
        {step === 'manual' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="manual-title" className="eyebrow">
                {copy.titleLabel} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="manual-title"
                autoFocus
                placeholder={copy.titlePlaceholder}
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="manual-author" className="eyebrow">
                {copy.authorLabel} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="manual-author"
                placeholder={copy.authorPlaceholder}
                value={manualAuthor}
                onChange={(e) => setManualAuthor(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="eyebrow">{copy.statusLabel}</Label>
              <Select value={manualStatus} onValueChange={(v) => { if (v) setManualStatus(v) }}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v) => getStatusLabel(v, locale)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStep('search')
                  setError(null)
                }}
              >
                {copy.back}
              </Button>
              <Button
                onClick={handleSaveManual}
                disabled={isSaving || !manualTitle.trim() || !manualAuthor.trim()}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {copy.adding}
                  </>
                ) : (
                  copy.add
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function MetadataLine({
  label,
  value,
}: {
  label: string
  value?: string | number | null
}) {
  if (value == null || value === '') {
    return null
  }

  return (
    <p className="flex items-start justify-between gap-3">
      <span className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-foreground">{value}</span>
    </p>
  )
}
