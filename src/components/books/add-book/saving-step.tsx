import { Loader2 } from 'lucide-react'
import { BookCover } from '@/components/books/book-cover'
import { Button } from '@/components/ui/button'
import type { BookSearchResult } from '@/lib/api/google-books'
import type { AddBookCopy } from './copy'
import { formatAuthors } from './helpers'

type AddBookSavingStepProps = {
  copy: AddBookCopy
  selected: BookSearchResult | null
}

export function AddBookSavingStep({ copy, selected }: AddBookSavingStepProps) {
  if (!selected) return null

  return (
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
  )
}
