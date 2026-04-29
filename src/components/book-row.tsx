import Link from 'next/link'
import { BookCover } from '@/components/book-cover'
import { BookLanguageBadge } from '@/components/book-language-badge'
import { RatingStars } from '@/components/rating-stars'
import { StatusBadge } from '@/components/status-badge'
import { cn } from '@/lib/utils'
import type { Book } from '@/lib/books/schema'
import { getBookAuthorsDisplay } from '@/lib/books/authors'
import { getBookCoverRoute } from '@/lib/covers/url'
import type { AppLanguage } from '@/lib/i18n/app-language'

interface BookRowProps {
  book: Book
  className?: string
  locale?: AppLanguage
  onSelectionChange?: (slug: string, selected: boolean) => void
  selectable?: boolean
  selected?: boolean
}

export function BookRow({
  book,
  className,
  locale = 'pt-BR',
  onSelectionChange,
  selectable = false,
  selected = false,
}: BookRowProps) {
  const slug = book._filename?.replace('.md', '') ?? ''
  const copy = {
    'pt-BR': { remove: 'Remover', select: 'Selecionar' },
    en: { remove: 'Remove', select: 'Select' },
    es: { remove: 'Quitar', select: 'Seleccionar' },
    'zh-CN': { remove: '移除', select: '选择' },
  }[locale]
  const content = (
    <>
      <BookCover src={getBookCoverRoute(book) ?? book.cover} alt={book.title} size="sm" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={book.status} locale={locale} />
          {book.rating ? <RatingStars value={book.rating} locale={locale} /> : null}
          <BookLanguageBadge language={book.language} />
        </div>
        <p className="line-clamp-1 break-words text-[1.02rem] font-bold leading-snug tracking-[-0.01em] text-foreground md:line-clamp-2">
          {book.subtitle ? `${book.title}: ${book.subtitle}` : book.title}
        </p>
        <p className="line-clamp-1 break-words text-sm font-medium text-foreground/78">
          {getBookAuthorsDisplay(book)}
        </p>
      </div>
      {selectable ? (
        <span
          aria-hidden="true"
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
            selected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-hairline-strong bg-surface text-transparent',
          )}
        >
          ✓
        </span>
      ) : null}
    </>
  )

  if (selectable) {
    return (
      <button
        aria-label={`${selected ? copy.remove : copy.select} ${book.title}`}
        aria-pressed={selected}
        className={cn(
          'group surface-transition flex items-center gap-4 rounded-lg border px-4 py-4 text-left shadow-none hover:-translate-y-px hover:border-hairline-strong hover:bg-surface-elevated hover:shadow-mac-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          selected ? 'border-primary bg-primary/10' : 'border-hairline bg-surface',
          className,
        )}
        onClick={() => slug && onSelectionChange?.(slug, !selected)}
        type="button"
      >
        {content}
      </button>
    )
  }

  return (
    <Link
      href={`/books/${slug}`}
      className={cn(
        'group surface-transition flex items-center gap-4 rounded-lg border border-hairline bg-surface px-4 py-4 shadow-none hover:-translate-y-px hover:border-hairline-strong hover:bg-surface-elevated hover:shadow-mac-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      {content}
    </Link>
  )
}
