'use client'

import Link from 'next/link'
import { BookCover } from '@/components/book-cover'
import { StatusBadge } from '@/components/status-badge'
import { cn } from '@/lib/utils'
import { useBookMeta } from './known-library-context'

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
 * Visual (UI-SPEC §Color row 132): bg-zinc-800 border-zinc-700 — one step
 * above the zinc-900 assistant bubble so the card hierarchy reads cleanly.
 */
export function LibraryBookCardInline({
  slug,
  className,
}: LibraryBookCardInlineProps) {
  const book = useBookMeta(slug)

  if (!book) {
    // D-14 guardrail: slug not in library → degrade to a neutral span, never
    // render a broken link.
    return (
      <span className="text-muted-foreground italic">
        (livro mencionado indisponível)
      </span>
    )
  }

  return (
    <Link
      href={`/books/${slug}`}
      aria-label={`Abrir ${book.title} de ${book.author} — status ${book.status}`}
      className={cn(
        'group flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800 p-3 transition-colors',
        'hover:border-zinc-600 focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
        'min-h-[44px] my-1 no-underline',
        className,
      )}
    >
      <BookCover src={book.cover} alt={book.title} size="sm" />
      <div className="flex flex-col gap-1 flex-1 min-w-0 overflow-hidden">
        <p className="text-sm font-semibold text-zinc-100 line-clamp-2 break-words">
          {book.title}
        </p>
        <p className="text-xs text-zinc-400 line-clamp-1 break-words">
          {book.author}
        </p>
        <div>
          <StatusBadge status={book.status} />
        </div>
      </div>
    </Link>
  )
}
