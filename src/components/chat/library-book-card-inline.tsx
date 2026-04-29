'use client'

import Link from 'next/link'
import { BookCover } from '@/components/book-cover'
import { StatusBadge } from '@/components/status-badge'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { getStatusLabel } from '@/lib/books/status-labels'
import { cn } from '@/lib/utils'
import { useBookMeta } from './known-library-context'
import { getChatCopy } from './chat-language'

interface LibraryBookCardInlineProps {
  slug: string
  className?: string
}

/**
 * Inline horizontal card rendered inside an assistant message bubble when
 * the librarian cites a book that IS in the user's library.
 *
 * D-14 anti-hallucination guardrail: the component's first action is
 * useBookMeta(slug). If the context returns null (slug absent from the
 * library — the LLM invented it, or the race condition bit), the card
 * degrades to a neutral italic span rather than rendering a link to
 * /books/{nonexistent}. This is the client-side half of the AI-08
 * guardrail; the server-side half ships in Plan 03.
 *
 * Visual: token-driven owned-book card with a solid border, subtle shadow,
 * and compact density so it reads as a real book surface inside the bubble.
 */
export function LibraryBookCardInline({ slug, className }: LibraryBookCardInlineProps) {
  const { locale } = useAppLanguage()
  const copy = getChatCopy(locale)
  const book = useBookMeta(slug)

  if (!book) {
    // D-14 guardrail: slug not in library → degrade to a neutral span, never
    // render a broken link.
    return <span className="text-muted-foreground italic">{copy.bookCard.unavailable}</span>
  }

  const statusLabel = getStatusLabel(book.status, locale).toLowerCase()

  return (
    <Link
      href={`/books/${slug}`}
      aria-label={copy.bookCard.openAria(book.title, book.author, statusLabel)}
      className={cn(
        'brand-panel group surface-transition my-1 flex min-h-[44px] items-center gap-3 px-3.5 py-3 no-underline shadow-none',
        'hover:-translate-y-0.5 hover:border-foreground focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <BookCover src={book.cover} alt={book.title} size="sm" />
      <div className="flex min-w-0 flex-1 flex-col gap-1 overflow-hidden">
        <p className="line-clamp-2 break-words text-sm font-medium text-foreground">{book.title}</p>
        <p className="line-clamp-1 break-words text-sm text-muted-foreground">{book.author}</p>
        <div>
          <StatusBadge status={book.status} locale={locale} />
        </div>
      </div>
    </Link>
  )
}
