import type * as React from 'react'
import { Loader2 } from 'lucide-react'
import { BookCover } from '@/components/books/book-cover'
import { BookLanguageBadge } from '@/components/books/book-language-badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BookSearchResult } from '@/lib/api/google-books'
import { getStatusLabel } from '@/lib/books/status-labels'
import type { AppLanguage } from '@/lib/i18n/app-language'
import type { Step } from './constants'
import type { AddBookCopy } from './copy'
import { formatAuthors, metadataSourceLabel } from './helpers'
import { MetadataLine } from './metadata-line'

type AddBookPreviewStepProps = {
  copy: AddBookCopy
  error: string | null
  handleSaveFromPreview: () => void
  isSaving: boolean
  locale: AppLanguage
  previewStatus: string
  selected: BookSearchResult | null
  setError: React.Dispatch<React.SetStateAction<string | null>>
  setPreviewStatus: React.Dispatch<React.SetStateAction<string>>
  setSelected: React.Dispatch<React.SetStateAction<BookSearchResult | null>>
  setStep: React.Dispatch<React.SetStateAction<Step>>
  statusOptions: Array<{ label: string; value: string }>
}

export function AddBookPreviewStep({
  copy,
  error,
  handleSaveFromPreview,
  isSaving,
  locale,
  previewStatus,
  selected,
  setError,
  setPreviewStatus,
  setSelected,
  setStep,
  statusOptions,
}: AddBookPreviewStepProps) {
  if (!selected) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <BookCover src={selected.cover} alt={selected.title} size="sm" />
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="line-clamp-3 break-words text-sm font-medium text-foreground">
            {selected.subtitle ? `${selected.title}: ${selected.subtitle}` : selected.title}
          </p>
          <p className="mt-0.5 line-clamp-2 break-words text-xs text-muted-foreground">
            {formatAuthors(selected.authors, copy)}
          </p>
          {selected.genre && (
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{selected.genre}</p>
          )}
          {selected.year && <p className="text-xs text-muted-foreground">{selected.year}</p>}
          <BookLanguageBadge language={selected.language} />
        </div>
      </div>

      <div className="brand-inset grid gap-2 px-4 py-3 text-sm text-muted-foreground">
        <MetadataLine label={copy.sourceLabel} value={metadataSourceLabel(selected.source, copy)} />
        <MetadataLine label={copy.publisherLabel} value={selected.publisher} />
        <MetadataLine label="ISBN-13" value={selected.isbn13} />
        <MetadataLine label="ISBN-10" value={selected.isbn10} />
        <MetadataLine label={copy.synopsisLabel} value={selected.synopsisSource} />
        <MetadataLine
          label={copy.coverLabel}
          value={
            (selected.coverSource ?? selected.cover)
              ? (selected.coverSource ?? copy.coverSourceExternal)
              : undefined
          }
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="eyebrow">{copy.statusLabel}</Label>
        <Select
          value={previewStatus}
          onValueChange={(v) => {
            if (v) setPreviewStatus(v)
          }}
        >
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
  )
}
