import type * as React from 'react'
import { Loader2, Search } from 'lucide-react'
import { BookCover } from '@/components/books/book-cover'
import { BookLanguageBadge } from '@/components/books/book-language-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { BookSearchResult } from '@/lib/api/google-books'
import type { BookLanguageFilter } from '@/lib/books/language'
import { BOOK_LANGUAGE_FILTER_OPTIONS, type Step } from './constants'
import type { AddBookCopy } from './copy'
import { formatAuthors, metadataSourceLabel } from './helpers'

type AddBookSearchStepProps = {
  bookLanguage: BookLanguageFilter
  copy: AddBookCopy
  error: string | null
  fetchMore: () => Promise<void>
  filterCopy: { all: string; label: string }
  handleBookLanguageChange: (value: BookLanguageFilter) => void
  handleQueryChange: (value: string) => void
  handleVisionImage: (file: File | null | undefined) => void
  hasMore: boolean
  imageInputRef: React.RefObject<HTMLInputElement | null>
  loadMoreError: string | null
  loadingMore: boolean
  query: string
  results: BookSearchResult[]
  searching: boolean
  sentinelRef: React.RefObject<HTMLDivElement | null>
  setError: React.Dispatch<React.SetStateAction<string | null>>
  setSelected: React.Dispatch<React.SetStateAction<BookSearchResult | null>>
  setStep: React.Dispatch<React.SetStateAction<Step>>
  visible: boolean
  visionImporting: boolean
}

export function AddBookSearchStep({
  bookLanguage,
  copy,
  error,
  fetchMore,
  filterCopy,
  handleBookLanguageChange,
  handleQueryChange,
  handleVisionImage,
  hasMore,
  imageInputRef,
  loadMoreError,
  loadingMore,
  query,
  results,
  searching,
  sentinelRef,
  setError,
  setSelected,
  setStep,
  visible,
  visionImporting,
}: AddBookSearchStepProps) {
  if (!visible) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label className="eyebrow">{filterCopy.label}</Label>
        <div role="group" aria-label={filterCopy.label} className="flex flex-wrap gap-2">
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
          <p className="mt-1">{copy.photoBody}</p>
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
        <p className="text-center text-sm text-muted-foreground">{copy.noResults}</p>
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
  )
}
