import Link from 'next/link'
import { BookCover } from '@/components/book-cover'
import { BookLanguageBadge } from '@/components/book-language-badge'
import { RatingStars } from '@/components/rating-stars'
import { StatusBadge } from '@/components/status-badge'
import { cn } from '@/lib/utils'
import type { Book } from '@/lib/books/schema'

interface BookRowProps {
  book: Book
  className?: string
}

export function BookRow({ book, className }: BookRowProps) {
  const slug = book._filename?.replace('.md', '') ?? ''
  return (
    <Link
      href={`/books/${slug}`}
      className={cn(
        'group surface-transition flex items-center gap-4 rounded-[1.6rem] border border-hairline bg-surface px-4 py-4 shadow-mac-sm hover:-translate-y-0.5 hover:bg-surface-elevated hover:shadow-mac-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <BookCover src={book.cover} alt={book.title} size="sm" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={book.status} />
          {book.rating ? <RatingStars value={book.rating} /> : null}
          <BookLanguageBadge language={book.language} />
        </div>
        <p className="line-clamp-1 break-words text-[0.96rem] font-medium tracking-[-0.03em] text-foreground md:line-clamp-2">
          {book.title}
        </p>
        <p className="line-clamp-1 break-words text-sm text-muted-foreground">
          {book.author}
        </p>
      </div>
    </Link>
  )
}
