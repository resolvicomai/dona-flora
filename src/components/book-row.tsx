import Link from 'next/link'
import { BookCover } from '@/components/book-cover'
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
        'group flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-mac-sm transition-[transform,box-shadow,border-color] duration-[var(--motion-fast)] hover:-translate-y-0.5 hover:border-border/80 hover:shadow-mac-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <BookCover src={book.cover} alt={book.title} size="sm" />
      <div className="flex flex-col gap-1 flex-1 min-w-0 overflow-hidden">
        <p className="text-sm font-medium text-foreground line-clamp-1 md:line-clamp-2 break-words">
          {book.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-1 break-words">
          {book.author}
        </p>
        <StatusBadge status={book.status} />
      </div>
    </Link>
  )
}
