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

function formatAuthors(authors: string[]): string {
  if (authors.length === 0) return 'Autor desconhecido'
  if (authors.length <= 2) return authors.join(', ')
  return `${authors[0]}, ${authors[1]} e +${authors.length - 2}`
}

interface AddBookDialogProps {
  triggerLabel?: string
}

export function AddBookDialog({ triggerLabel }: AddBookDialogProps) {
  const router = useRouter()
  const { locale } = useAppLanguage()
  const filterCopy = BOOK_LANGUAGE_FILTER_COPY[locale]
  const statusOptions = getStatusOptions(locale)

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('search')
  const [query, setQuery] = useState('')
  const [bookLanguage, setBookLanguage] = useState<BookLanguageFilter>('all')
  const [results, setResults] = useState<BookSearchResult[]>([])
  const [selected, setSelected] = useState<BookSearchResult | null>(null)
  const [searching, setSearching] = useState(false)
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
      if (!res.ok) throw new Error()
      const data: BookSearchResult[] = await res.json()
      setResults(data)
      setStep(data.length > 0 ? 'results' : 'search')
      setHasMore(data.length >= 20)
      setNextStart(20)
      setNextPage(2)
    } catch {
      setError('Erro ao buscar. Tente novamente.')
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
      if (!res.ok) throw new Error()
      const data: BookSearchResult[] = await res.json()
      if (data.length === 0) {
        setHasMore(false)
        return
      }
      setResults((prev) => dedupeBooks([...prev, ...data]))
      setNextStart((s) => s + 20)
      setNextPage((p) => p + 1)
      if (data.length < 20) setHasMore(false)
    } catch {
      setLoadMoreError('Não foi possível carregar mais resultados.')
    } finally {
      setLoadingMore(false)
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
      setError('Erro ao adicionar livro. Tente novamente.')
      setStep(previousStep === 'saving' ? 'preview' : previousStep)
    }
  }

  function handleSaveFromPreview() {
    if (!selected) return
    saveBook({
      title: selected.title,
      author: selected.authors.join(', '),
      isbn: selected.isbn,
      synopsis: selected.synopsis,
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
            <Button aria-label="Adicionar livro">
              <Plus />
              <span className="hidden md:inline">Adicionar livro</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-semibold tracking-[-0.03em] text-foreground">
            {step === 'manual' ? 'Adicionar manualmente' : 'Adicionar livro'}
          </DialogTitle>
        </DialogHeader>

        {/* Search step + Results step */}
        {(step === 'search' || step === 'results' || step === 'saving') && selected === null && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-[0.7rem] tracking-[0.16em] text-muted-foreground uppercase">
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
                  className={`surface-transition inline-flex h-9 items-center justify-center rounded-full border px-3 text-[0.76rem] font-medium tracking-[0.06em] ${
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
                    className={`surface-transition inline-flex h-9 items-center justify-center rounded-full border px-3 text-[0.76rem] font-medium tracking-[0.06em] ${
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
                placeholder="Buscar por título ou ISBN…"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="pl-11 pr-10"
              />
              {searching && (
                <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
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
                    className="surface-transition flex w-full items-start gap-3 rounded-[1.35rem] p-3 text-left hover:bg-foreground/[0.05]"
                  >
                    <BookCover src={book.cover} alt={book.title} size="sm" />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="line-clamp-2 break-words text-sm font-medium tracking-[-0.02em] text-foreground">
                        {book.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 break-words text-xs text-muted-foreground">
                        {formatAuthors(book.authors)}
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
                      Tentar novamente
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* No results state */}
            {!searching && query.length >= 3 && results.length === 0 && !error && (
              <p className="text-center text-sm text-muted-foreground">
                Nenhum resultado encontrado.
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
                Não encontrei meu livro
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
                  {selected.title}
                </p>
                <p className="mt-0.5 line-clamp-2 break-words text-xs text-muted-foreground">
                  {formatAuthors(selected.authors)}
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

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm text-muted-foreground">Status</Label>
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
                Voltar
              </Button>
              <Button onClick={handleSaveFromPreview} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adicionando…
                  </>
                ) : (
                  'Adicionar'
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
                  {formatAuthors(selected.authors)}
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adicionando…
              </Button>
            </div>
          </div>
        )}

        {/* Manual form */}
        {step === 'manual' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="manual-title" className="text-sm text-muted-foreground">
                Título do livro <span className="text-destructive">*</span>
              </Label>
              <Input
                id="manual-title"
                autoFocus
                placeholder="Título do livro"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="manual-author" className="text-sm text-muted-foreground">
                Autor <span className="text-destructive">*</span>
              </Label>
              <Input
                id="manual-author"
                placeholder="Autor"
                value={manualAuthor}
                onChange={(e) => setManualAuthor(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm text-muted-foreground">Status</Label>
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
                Voltar
              </Button>
              <Button
                onClick={handleSaveManual}
                disabled={isSaving || !manualTitle.trim() || !manualAuthor.trim()}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adicionando…
                  </>
                ) : (
                  'Adicionar'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
