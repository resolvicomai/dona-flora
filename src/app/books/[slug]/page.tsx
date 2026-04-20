import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'
import { getBook } from '@/lib/books/library-service'
import { renderMarkdown } from '@/lib/markdown'
import { BookCover } from '@/components/book-cover'
import { BookEditForm } from '@/components/book-edit-form'
import { DeleteBookButton } from '@/components/delete-book-button'
import { ConversarSobreLivroButton } from '@/components/chat/conversar-sobre-livro-button'

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
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6 md:px-8">
      {/* Book header: cover + metadata */}
      <div className="mb-8 flex flex-col gap-6 md:flex-row">
        {/* Cover — centered on mobile, left on desktop */}
        <div className="flex shrink-0 justify-center md:justify-start">
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
        <div className="flex flex-1 flex-col gap-2 text-center md:text-left">
          <h1 className="text-[28px] font-semibold leading-tight text-zinc-100">
            {book.title}
          </h1>
          <p className="text-sm text-zinc-400">{book.author}</p>

          {/* Static metadata (non-editable) */}
          <div className="mt-4 space-y-2 text-sm">
            {book.genre && (
              <div className="flex items-center gap-2">
                <span className="w-16 text-zinc-400">Genero:</span>
                <span className="text-zinc-100">{book.genre}</span>
              </div>
            )}
            {book.year && (
              <div className="flex items-center gap-2">
                <span className="w-16 text-zinc-400">Ano:</span>
                <span className="text-zinc-100">{book.year}</span>
              </div>
            )}
            {book.isbn && (
              <div className="flex items-center gap-2">
                <span className="w-16 text-zinc-400">ISBN:</span>
                <span className="font-mono text-xs text-zinc-100">
                  {book.isbn}
                </span>
              </div>
            )}
          </div>

          {/* CTA: Conversar sobre este livro — desktop right-aligned,
              mobile full-width below metadata (UI-SPEC §Entry points). */}
          <div className="mt-4 flex justify-center md:mt-auto md:justify-end">
            <ConversarSobreLivroButton slug={slug} titulo={book.title} />
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
      <div className="mt-8 border-t border-zinc-800 pt-8">
        <DeleteBookButton
          slug={slug}
          filename={book._filename ?? `${slug}.md`}
        />
      </div>
    </div>
  )
}
