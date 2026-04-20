import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'
import { getBook } from '@/lib/books/library-service'
import {
  getSessionStorageContext,
  requireVerifiedServerSession,
} from '@/lib/auth/server'
import { renderMarkdown } from '@/lib/markdown'
import { BookCover } from '@/components/book-cover'
import { BookLanguageBadge } from '@/components/book-language-badge'
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
  const session = await requireVerifiedServerSession()
  const storageContext = getSessionStorageContext(session)
  const { slug } = await params
  const book = await getBook(slug, storageContext)
  if (!book) notFound()

  // Pre-render notes on server (sanitized HTML)
  const renderedNotes = book._notes ? await renderMarkdown(book._notes) : ''

  return (
    <div className="page-frame flex w-full flex-1 flex-col gap-8 pt-7 md:gap-10 md:pt-9">
      <section className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
        <div className="panel-quiet flex shrink-0 justify-center rounded-[2rem] p-5 md:justify-start">
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

        <div className="panel-solid flex flex-1 flex-col gap-5 rounded-[2rem] p-6 text-center md:text-left">
          <div>
            <p className="eyebrow">Livro</p>
            <h1 className="mt-4 text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.08em] text-foreground">
              {book.title}
            </h1>
            <p className="mt-3 text-base text-muted-foreground">{book.author}</p>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            {book.genre && (
              <div className="rounded-[1.4rem] border border-hairline bg-surface px-4 py-3">
                <p className="eyebrow">Gênero</p>
                <p className="mt-2 text-sm font-medium text-foreground">{book.genre}</p>
              </div>
            )}
            {book.year && (
              <div className="rounded-[1.4rem] border border-hairline bg-surface px-4 py-3">
                <p className="eyebrow">Ano</p>
                <p className="mt-2 text-sm font-medium text-foreground">{book.year}</p>
              </div>
            )}
            {book.language && (
              <div className="rounded-[1.4rem] border border-hairline bg-surface px-4 py-3">
                <p className="eyebrow">Idioma</p>
                <div className="mt-2">
                  <BookLanguageBadge language={book.language} />
                </div>
              </div>
            )}
            {book.isbn && (
              <div className="rounded-[1.4rem] border border-hairline bg-surface px-4 py-3 sm:col-span-2">
                <p className="eyebrow">ISBN</p>
                <p className="mt-2 font-mono text-sm text-foreground">
                  {book.isbn}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-center md:mt-auto md:justify-end">
            <ConversarSobreLivroButton slug={slug} titulo={book.title} />
          </div>
        </div>
      </section>

      <BookEditForm
        slug={slug}
        initialStatus={book.status}
        initialRating={book.rating}
        initialNotes={book._notes}
        renderedNotes={renderedNotes}
      />

      <div className="border-t border-hairline pt-6">
        <DeleteBookButton
          slug={slug}
          filename={book._filename ?? `${slug}.md`}
        />
      </div>
    </div>
  )
}
