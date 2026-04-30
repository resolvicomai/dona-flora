'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import type { BookSearchResult } from '@/lib/api/google-books'
import { dedupeBooks } from '@/lib/api/dedupe'
import { normalizeBookLanguageFilter, type BookLanguageFilter } from '@/lib/books/language'
import { getStatusOptions } from '@/lib/books/status-labels'
import { AddBookManualStep } from './manual-step'
import { AddBookPreviewStep } from './preview-step'
import { AddBookSavingStep } from './saving-step'
import { AddBookSearchStep } from './search-step'
import type { Step } from './constants'
import { ADD_BOOK_COPY, BOOK_LANGUAGE_FILTER_COPY } from './copy'
import { getSearchErrorMessage } from './helpers'

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
      setError(err instanceof Error ? err.message : copy.searchError)
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
      setLoadMoreError(err instanceof Error ? err.message : copy.unableToLoadMore)
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
            <Button className="w-full">{triggerLabel}</Button>
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

        <AddBookSearchStep
          bookLanguage={bookLanguage}
          copy={copy}
          error={error}
          fetchMore={fetchMore}
          filterCopy={filterCopy}
          handleBookLanguageChange={handleBookLanguageChange}
          handleQueryChange={handleQueryChange}
          handleVisionImage={handleVisionImage}
          hasMore={hasMore}
          imageInputRef={imageInputRef}
          loadMoreError={loadMoreError}
          loadingMore={loadingMore}
          query={query}
          results={results}
          searching={searching}
          sentinelRef={sentinelRef}
          setError={setError}
          setSelected={setSelected}
          setStep={setStep}
          visible={
            (step === 'search' || step === 'results' || step === 'saving') && selected === null
          }
          visionImporting={visionImporting}
        />

        {step === 'preview' ? (
          <AddBookPreviewStep
            copy={copy}
            error={error}
            handleSaveFromPreview={handleSaveFromPreview}
            isSaving={isSaving}
            locale={locale}
            previewStatus={previewStatus}
            selected={selected}
            setError={setError}
            setPreviewStatus={setPreviewStatus}
            setSelected={setSelected}
            setStep={setStep}
            statusOptions={statusOptions}
          />
        ) : null}

        {step === 'saving' ? <AddBookSavingStep copy={copy} selected={selected} /> : null}

        <AddBookManualStep
          copy={copy}
          error={error}
          handleSaveManual={handleSaveManual}
          isSaving={isSaving}
          locale={locale}
          manualAuthor={manualAuthor}
          manualStatus={manualStatus}
          manualTitle={manualTitle}
          setError={setError}
          setManualAuthor={setManualAuthor}
          setManualStatus={setManualStatus}
          setManualTitle={setManualTitle}
          setStep={setStep}
          statusOptions={statusOptions}
          visible={step === 'manual'}
        />
      </DialogContent>
    </Dialog>
  )
}
