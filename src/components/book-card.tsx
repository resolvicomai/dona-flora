import Link from 'next/link'
import { BookCover } from '@/components/book-cover'
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
        'group flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition-colors hover:border-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
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
        <StatusBadge status={book.status} />
      </div>
    </Link>
  )
}
