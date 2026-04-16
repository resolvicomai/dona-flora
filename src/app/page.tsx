import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'

import { listBooks } from '@/lib/books/library-service'
import { AddBookDialog } from '@/components/add-book-dialog'
import { StatusBadge } from '@/components/status-badge'
import { BookCover } from '@/components/book-cover'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  noStore()
  const books = await listBooks()

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header - sticky */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm px-4 py-3 md:px-8">
        <h1 className="text-xl font-semibold text-zinc-100">Dona Flora</h1>
        <AddBookDialog />
      </header>

      <div className="flex-1 px-4 py-6 md:px-8">
        {books.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <BookOpen className="h-16 w-16 text-zinc-700" />
            <h2 className="text-xl font-semibold text-zinc-100">
              Sua biblioteca esta vazia
            </h2>
            <p className="text-sm text-zinc-400 max-w-sm">
              Adicione seu primeiro livro para comecar a catalogar sua colecao.
            </p>
            <AddBookDialog triggerLabel="Adicionar primeiro livro" />
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-zinc-400">
              {books.length} livro{books.length !== 1 ? 's' : ''} na biblioteca
            </p>

            {/* Book grid — responsive:
                Mobile: single col horizontal list items
                Desktop: 3-4 col card grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {books.map((book) => {
                const slug = book._filename?.replace('.md', '') ?? ''
                return (
                  <Link
                    key={slug}
                    href={`/books/${slug}`}
                    className="group flex md:flex-col items-center md:items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition-colors hover:border-zinc-700"
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
              })}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
