import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'
import { getBook } from '@/lib/books/library-service'
import {
  getSessionStorageContext,
  requireVerifiedServerSession,
} from '@/lib/auth/server'
import { getUserSettings } from '@/lib/auth/db'
import type { AppLanguage } from '@/lib/i18n/app-language'
import { renderMarkdown } from '@/lib/markdown'
import { BookCover } from '@/components/book-cover'
import { BookLanguageBadge } from '@/components/book-language-badge'
import { BookEditForm } from '@/components/book-edit-form'
import { DeleteBookButton } from '@/components/delete-book-button'
import { ConversarSobreLivroButton } from '@/components/chat/conversar-sobre-livro-button'
import { PageReturnLink } from '@/components/app-shell/page-return-link'
import { getBookAuthorsDisplay } from '@/lib/books/authors'
import { getCoverRoute } from '@/lib/covers/url'

export const dynamic = 'force-dynamic'

const BOOK_DETAIL_COPY: Record<
  AppLanguage,
  {
    authorLabel: string
    genre: string
    language: string
    publisher: string
    series: string
    translator: string
    year: string
  }
> = {
  'pt-BR': {
    authorLabel: 'Livro',
    genre: 'Gênero',
    language: 'Idioma',
    publisher: 'Editora',
    series: 'Série',
    translator: 'Tradução',
    year: 'Ano',
  },
  en: {
    authorLabel: 'Book',
    genre: 'Genre',
    language: 'Language',
    publisher: 'Publisher',
    series: 'Series',
    translator: 'Translation',
    year: 'Year',
  },
  es: {
    authorLabel: 'Libro',
    genre: 'Género',
    language: 'Idioma',
    publisher: 'Editorial',
    series: 'Serie',
    translator: 'Traducción',
    year: 'Año',
  },
  'zh-CN': {
    authorLabel: '图书',
    genre: '类型',
    language: '语言',
    publisher: '出版社',
    series: '系列',
    translator: '译者',
    year: '年份',
  },
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  noStore()
  const session = await requireVerifiedServerSession()
  const locale = getUserSettings(session.user.id).language
  const copy = BOOK_DETAIL_COPY[locale]
  const storageContext = getSessionStorageContext(session)
  const { slug } = await params
  const book = await getBook(slug, storageContext)
  if (!book) notFound()
  const coverSrc = getCoverRoute(slug) ?? book.cover

  // Pre-render notes on server (sanitized HTML)
  const renderedNotes = book._notes ? await renderMarkdown(book._notes) : ''

  return (
    <div className="page-frame flex w-full flex-1 flex-col gap-8 pt-7 md:gap-10 md:pt-9">
      <PageReturnLink />

      <section className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
        <div className="brand-panel flex shrink-0 justify-center p-5 md:justify-start">
          <BookCover
            src={coverSrc}
            alt={book.title}
            size="lg"
            className="hidden md:block"
          />
          <BookCover
            src={coverSrc}
            alt={book.title}
            size="md"
            className="md:hidden"
          />
        </div>

        <div className="brand-window flex flex-1 flex-col gap-5 p-6 text-center md:text-left">
          <div>
            <p className="eyebrow">{copy.authorLabel}</p>
            <h1 className="mt-4 text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-none tracking-normal text-foreground">
              {book.title}
            </h1>
            {book.subtitle ? (
              <p className="mt-3 text-lg text-foreground/80">{book.subtitle}</p>
            ) : null}
            <p className="mt-3 text-base text-muted-foreground">
              {getBookAuthorsDisplay(book)}
            </p>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            {book.genre && (
              <div className="brand-inset px-4 py-3">
                <p className="eyebrow">{copy.genre}</p>
                <p className="mt-2 text-sm font-medium text-foreground">{book.genre}</p>
              </div>
            )}
            {book.year && (
              <div className="brand-inset px-4 py-3">
                <p className="eyebrow">{copy.year}</p>
                <p className="mt-2 text-sm font-medium text-foreground">{book.year}</p>
              </div>
            )}
            {book.publisher && (
              <div className="brand-inset px-4 py-3">
                <p className="eyebrow">{copy.publisher}</p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {book.publisher}
                </p>
              </div>
            )}
            {book.translator && (
              <div className="brand-inset px-4 py-3">
                <p className="eyebrow">{copy.translator}</p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {book.translator}
                </p>
              </div>
            )}
            {book.series && (
              <div className="brand-inset px-4 py-3">
                <p className="eyebrow">{copy.series}</p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {book.series}
                  {book.series_index ? ` #${book.series_index}` : ''}
                </p>
              </div>
            )}
            {book.language && (
              <div className="brand-inset px-4 py-3">
                <p className="eyebrow">{copy.language}</p>
                <div className="mt-2">
                  <BookLanguageBadge language={book.language} />
                </div>
              </div>
            )}
            {(book.isbn_13 || book.isbn_10 || book.isbn) && (
              <div className="brand-inset px-4 py-3 sm:col-span-2">
                <p className="eyebrow">ISBN</p>
                <p className="mt-2 font-mono text-sm text-foreground">
                  {book.isbn_13 ?? book.isbn_10 ?? book.isbn}
                </p>
              </div>
            )}
            {book.tags && book.tags.length > 0 ? (
              <div className="brand-inset px-4 py-3 sm:col-span-2">
                <p className="eyebrow">Tags</p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {book.tags.map((tag) => `#${tag.replace(/^#/, '')}`).join(' ')}
                </p>
              </div>
            ) : null}
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
