'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Search } from 'lucide-react'

import { BookCover } from '@/components/book-cover'
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

import type { BookSearchResult } from '@/lib/api/google-books'
import { dedupeBooks } from '@/lib/api/dedupe'
import { STATUS_OPTIONS, getStatusLabel } from '@/lib/books/status-labels'

type Step = 'search' | 'results' | 'preview' | 'manual' | 'saving'

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

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('search')
  const [query, setQuery] = useState('')
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

  function resetDialog() {
    setStep('search')
    setQuery('')
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
    // Reset pagination on every query change (RESEARCH Pitfall 7 + Anti-Pattern 9)
    setResults([])
    setNextStart(0)
    setNextPage(1)
    setHasMore(true)
    setLoadingMore(false)

    if (timerRef.current) clearTimeout(timerRef.current)

    if (value.length < 3) {
      setStep('search')
      return
    }

    timerRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch('/api/books/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: value }),
        })
        if (!res.ok) throw new Error()
        const data: BookSearchResult[] = await res.json()
        setResults(data)
        setStep(data.length > 0 ? 'results' : 'search')
        // If initial page returned fewer than the per-page cap (20), no more pages.
        setHasMore(data.length >= 20)
        setNextStart(20)
        setNextPage(2)
      } catch {
        setError('Erro ao buscar. Tente novamente.')
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  async function fetchMore() {
    if (!hasMore || loadingMore || !query || query.length < 3) return
    setLoadingMore(true)
    setLoadMoreError(null)
    try {
      const res = await fetch('/api/books/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, startIndex: nextStart, page: nextPage }),
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'manual' ? 'Adicionar manualmente' : 'Adicionar livro'}
          </DialogTitle>
        </DialogHeader>

        {/* Search step + Results step */}
        {(step === 'search' || step === 'results' || step === 'saving') && selected === null && (
          <div className="flex flex-col gap-4">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <Input
                autoFocus
                placeholder="Buscar por titulo ou ISBN..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="pl-8 pr-8"
              />
              {searching && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-zinc-400" />
              )}
            </div>

            {/* Error */}
            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* Results */}
            {results.length > 0 && (
              <div className="flex flex-col gap-1 max-h-[50vh] overflow-y-auto pr-1 -mr-1">
                {results.map((book, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelected(book)
                      setStep('preview')
                    }}
                    className="flex items-start gap-3 w-full rounded-lg p-2 text-left hover:bg-zinc-800 transition-colors"
                  >
                    <BookCover src={book.cover} alt={book.title} size="sm" />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="text-sm font-semibold text-zinc-100 line-clamp-2 break-words">
                        {book.title}
                      </p>
                      <p className="text-xs text-zinc-400 line-clamp-1 break-words mt-0.5">
                        {formatAuthors(book.authors)}
                      </p>
                    </div>
                  </button>
                ))}
                {hasMore && <div ref={sentinelRef} className="h-4" aria-hidden />}
                {loadingMore && (
                  <div className="flex items-center justify-center py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  </div>
                )}
                {loadMoreError && (
                  <div className="flex flex-col items-center gap-2 py-3 text-center">
                    <p className="text-xs text-zinc-400">{loadMoreError}</p>
                    <button
                      type="button"
                      onClick={fetchMore}
                      className="text-sm text-zinc-300 underline hover:text-zinc-100 transition-colors"
                    >
                      Tentar novamente
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* No results state */}
            {!searching && query.length >= 3 && results.length === 0 && !error && (
              <p className="text-sm text-zinc-400 text-center">Nenhum resultado encontrado.</p>
            )}

            {/* Manual add link */}
            {query.length >= 3 && !searching && (
              <button
                onClick={() => {
                  setError(null)
                  setStep('manual')
                }}
                className="text-sm text-zinc-400 underline hover:text-zinc-200 text-center transition-colors"
              >
                Nao encontrei meu livro
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
                <p className="text-sm font-semibold text-zinc-100 line-clamp-3 break-words">
                  {selected.title}
                </p>
                <p className="text-xs text-zinc-400 line-clamp-2 break-words mt-0.5">
                  {formatAuthors(selected.authors)}
                </p>
                {selected.genre && (
                  <p className="text-xs text-zinc-500 line-clamp-1 mt-1">{selected.genre}</p>
                )}
                {selected.year && (
                  <p className="text-xs text-zinc-500">{selected.year}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm text-zinc-400">Status</Label>
              <Select value={previewStatus} onValueChange={(v) => { if (v) setPreviewStatus(v) }}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v) => getStatusLabel(v)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

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
                    Adicionando...
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
                <p className="text-sm font-semibold text-zinc-100 line-clamp-3 break-words">
                  {selected.title}
                </p>
                <p className="text-xs text-zinc-400 line-clamp-2 break-words mt-0.5">
                  {formatAuthors(selected.authors)}
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adicionando...
              </Button>
            </div>
          </div>
        )}

        {/* Manual form */}
        {step === 'manual' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="manual-title" className="text-sm text-zinc-400">
                Titulo do livro <span className="text-red-500">*</span>
              </Label>
              <Input
                id="manual-title"
                autoFocus
                placeholder="Titulo do livro"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="manual-author" className="text-sm text-zinc-400">
                Autor <span className="text-red-500">*</span>
              </Label>
              <Input
                id="manual-author"
                placeholder="Autor"
                value={manualAuthor}
                onChange={(e) => setManualAuthor(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm text-zinc-400">Status</Label>
              <Select value={manualStatus} onValueChange={(v) => { if (v) setManualStatus(v) }}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v) => getStatusLabel(v)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

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
                    Adicionando...
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
