import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getBook } from '@/lib/books/library-service'
import { renderMarkdown } from '@/lib/markdown'
import { BookCover } from '@/components/book-cover'
import { BookEditForm } from '@/components/book-edit-form'
import { DeleteBookButton } from '@/components/delete-book-button'

export const dynamic = 'force-dynamic'

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  noStore()
  const { slug } = await params
  const book = await getBook(slug)
  if (!book) notFound()

  // Pre-render notes on server (sanitized HTML)
  const renderedNotes = book._notes ? await renderMarkdown(book._notes) : ''

  return (
    <main className="flex min-h-screen flex-col">
      {/* Back navigation */}
      <header className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </header>

      <div className="flex-1 px-4 py-6 md:px-8 max-w-4xl mx-auto w-full">
        {/* Book header: cover + metadata */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Cover — centered on mobile, left on desktop */}
          <div className="flex justify-center md:justify-start shrink-0">
            <BookCover
              src={book.cover}
              alt={book.title}
              size="lg"
              className="hidden md:block"
            />
            <BookCover
              src={book.cover}
              alt={book.title}
              size="md"
              className="md:hidden"
            />
          </div>

          {/* Title + author + static metadata */}
          <div className="flex flex-col gap-2 text-center md:text-left">
            <h1 className="text-[28px] font-semibold leading-tight text-zinc-100">
              {book.title}
            </h1>
            <p className="text-sm text-zinc-400">{book.author}</p>

            {/* Static metadata (non-editable) */}
            <div className="mt-4 space-y-2 text-sm">
              {book.genre && (
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 w-16">Genero:</span>
                  <span className="text-zinc-100">{book.genre}</span>
                </div>
              )}
              {book.year && (
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 w-16">Ano:</span>
                  <span className="text-zinc-100">{book.year}</span>
                </div>
              )}
              {book.isbn && (
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 w-16">ISBN:</span>
                  <span className="text-zinc-100 font-mono text-xs">
                    {book.isbn}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Editable section: status, rating, notes */}
        <BookEditForm
          slug={slug}
          initialStatus={book.status}
          initialRating={book.rating}
          initialNotes={book._notes}
          renderedNotes={renderedNotes}
        />

        {/* Delete button — bottom of page */}
        <div className="mt-8 pt-8 border-t border-zinc-800">
          <DeleteBookButton
            slug={slug}
            filename={book._filename ?? `${slug}.md`}
          />
        </div>
      </div>
    </main>
  )
}
