import Link from 'next/link'
import { BookCover } from '@/components/book-cover'
import { BookLanguageBadge } from '@/components/book-language-badge'
import { RatingStars } from '@/components/rating-stars'
import { StatusBadge } from '@/components/status-badge'
import { cn } from '@/lib/utils'
import type { Book } from '@/lib/books/schema'

interface BookCardProps {
  book: Book
  className?: string
}

export function BookCard({ book, className }: BookCardProps) {
  const slug = book._filename?.replace('.md', '') ?? ''
  return (
    <Link
      href={`/books/${slug}`}
      className={cn(
        'group surface-transition flex flex-col gap-4 rounded-[1.85rem] p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <div className="panel-quiet overflow-hidden rounded-[1.7rem] p-4 group-hover:-translate-y-0.5 group-hover:shadow-mac-md">
        <BookCover src={book.cover} alt={book.title} size="card" className="mx-auto" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-hidden px-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={book.status} className="self-start" />
          {book.rating ? <RatingStars value={book.rating} /> : null}
          <BookLanguageBadge language={book.language} />
        </div>
        <p className="line-clamp-2 break-words text-[0.96rem] font-medium tracking-[-0.03em] text-foreground">
          {book.title}
        </p>
        <p className="line-clamp-1 break-words text-sm text-muted-foreground">
          {book.author}
        </p>
      </div>
    </Link>
  )
}
