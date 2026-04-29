import Link from 'next/link'
import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { ArrowRight, CheckCircle2, Circle, CircleDot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BookCover } from '@/components/book-cover'
import { PageReturnLink } from '@/components/app-shell/page-return-link'
import { StatusBadge } from '@/components/status-badge'
import { TrailActions } from '@/components/trails/trail-actions'
import { getBookAuthorsDisplay } from '@/lib/books/authors'
import { listBooks } from '@/lib/books/library-service'
import type { Book } from '@/lib/books/schema'
import { getCoverRoute } from '@/lib/covers/url'
import {
  getSessionStorageContext,
  requireVerifiedServerSession,
} from '@/lib/auth/server'
import { getUserSettings } from '@/lib/auth/db'
import { getTrail } from '@/lib/trails/store'
import type { AppLanguage } from '@/lib/i18n/app-language'

export const dynamic = 'force-dynamic'

const COPY: Record<
  AppLanguage,
  {
    back: string
    done: string
    howBody: string
    howTitle: string
    missingBook: string
    openBook: string
    progress: (done: number, total: number) => string
    reading: string
    todo: string
  }
> = {
  'pt-BR': {
    back: 'Voltar para Trilhas',
    done: 'Lido',
    howBody:
      'Para acompanhar, abra cada livro e mude o status para lendo ou lido. A trilha não tem checklist separado: ela acompanha o estado real do seu acervo.',
    howTitle: 'Como acompanhar',
    missingBook: 'Este livro não foi encontrado no acervo.',
    openBook: 'Abrir livro',
    progress: (done, total) => `${done}/${total} lidos`,
    reading: 'Em leitura',
    todo: 'Próximo',
  },
  en: {
    back: 'Back to Trails',
    done: 'Read',
    howBody:
      'To track it, open each book and change its status to reading or read. The trail has no separate checklist: it follows the real state of your library.',
    howTitle: 'How to track',
    missingBook: 'This book was not found in the library.',
    openBook: 'Open book',
    progress: (done, total) => `${done}/${total} read`,
    reading: 'Reading',
    todo: 'Next',
  },
  es: {
    back: 'Volver a Rutas',
    done: 'Leído',
    howBody:
      'Para acompañarla, abre cada libro y cambia su estado a leyendo o leído. La ruta no tiene checklist separado: sigue el estado real de tu biblioteca.',
    howTitle: 'Cómo acompañar',
    missingBook: 'Este libro no se encontró en la biblioteca.',
    openBook: 'Abrir libro',
    progress: (done, total) => `${done}/${total} leídos`,
    reading: 'Leyendo',
    todo: 'Próximo',
  },
  'zh-CN': {
    back: '返回路径',
    done: '已读',
    howBody:
      '要跟进路径，请打开每本书并把状态改为在读或已读。路径没有单独的清单；它跟随书库里的真实状态。',
    howTitle: '如何跟进',
    missingBook: '书库中找不到这本书。',
    openBook: '打开书籍',
    progress: (done, total) => `已读 ${done}/${total}`,
    reading: '在读',
    todo: '下一本',
  },
}

export default async function TrailDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  noStore()
  const session = await requireVerifiedServerSession()
  const storageContext = getSessionStorageContext(session)
  const { slug } = await params
  const [trail, books, settings] = await Promise.all([
    getTrail(slug, storageContext),
    listBooks(storageContext),
    Promise.resolve(getUserSettings(session.user.id)),
  ])

  if (!trail) notFound()

  const copy = COPY[settings.language]
  const bookBySlug = buildBookMap(books)
  const done = trail.book_refs.filter(
    (bookSlug) => bookBySlug.get(bookSlug)?.status === 'lido',
  ).length
  const percent =
    trail.book_refs.length > 0
      ? Math.round((done / trail.book_refs.length) * 100)
      : 0

  return (
    <div className="page-column flex flex-1 flex-col gap-6 pt-7 md:gap-8 md:pt-9">
      <PageReturnLink href="/trails" label={copy.back} />

      <section className="brand-window overflow-hidden">
        <div className="grid gap-6 border-b border-hairline p-6 md:grid-cols-[minmax(0,1fr)_18rem] md:p-8">
          <div>
            <p className="eyebrow">{copy.progress(done, trail.book_refs.length)}</p>
            <h1 className="section-title mt-4 text-balance text-foreground">
              {trail.title}
            </h1>
            {trail.goal ? (
              <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
                {trail.goal}
              </p>
            ) : null}
            <div className="mt-6">
              <TrailActions
                goal={trail.goal}
                notes={trail._notes}
                slug={trail.slug}
                title={trail.title}
              />
            </div>
          </div>
          <aside className="brand-guide p-4">
            <h2 className="text-base font-semibold text-foreground">
              {copy.howTitle}
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {copy.howBody}
            </p>
          </aside>
        </div>
        <div className="h-2 bg-surface-strong">
          <div
            className="h-full bg-primary"
            style={{ width: `${percent}%` }}
          />
        </div>
      </section>

      {trail._notes.trim() ? (
        <section className="brand-guide p-5">
          <p className="eyebrow">Notas</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
            {trail._notes.trim()}
          </p>
        </section>
      ) : null}

      <ol className="flex list-none flex-col gap-4 p-0">
        {trail.book_refs.map((bookSlug, index) => {
          const book = bookBySlug.get(bookSlug)
          return (
            <li key={`${bookSlug}-${index}`}>
              <TrailStep
                book={book}
                copy={copy}
                index={index}
                locale={settings.language}
              />
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function TrailStep({
  book,
  copy,
  index,
  locale,
}: {
  book: Book | undefined
  copy: (typeof COPY)[AppLanguage]
  index: number
  locale: AppLanguage
}) {
  const state =
    book?.status === 'lido'
      ? 'done'
      : book?.status === 'lendo'
        ? 'reading'
        : 'todo'

  return (
    <article className="brand-window grid gap-4 p-4 md:grid-cols-[4rem_5rem_minmax(0,1fr)_auto] md:items-center">
      <div className="flex items-center gap-3 md:block">
        <span className="flex h-11 w-11 items-center justify-center rounded-md border border-hairline-strong bg-surface-strong font-mono text-sm font-semibold">
          {index + 1}
        </span>
        <StepStateIcon state={state} />
      </div>

      {book ? (
        <BookCover
          src={getCoverRoute(book._filename) ?? book.cover}
          alt={book.title}
          size="sm"
        />
      ) : (
        <div className="brand-panel h-[84px] w-[56px]" />
      )}

      <div className="min-w-0">
        {book ? (
          <>
            <h2 className="truncate text-xl font-semibold text-foreground">
              {book.title}
            </h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {getBookAuthorsDisplay(book)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={book.status} locale={locale} />
              <span className="text-xs font-medium text-muted-foreground">
                {state === 'done'
                  ? copy.done
                  : state === 'reading'
                    ? copy.reading
                    : copy.todo}
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{copy.missingBook}</p>
        )}
      </div>

      {book?._filename ? (
        <Button
          render={<Link href={`/books/${book._filename.replace(/\.md$/, '')}`} />}
          variant="outline"
          className="justify-between"
        >
          {copy.openBook}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      ) : null}
    </article>
  )
}

function StepStateIcon({ state }: { state: 'done' | 'reading' | 'todo' }) {
  if (state === 'done') {
    return <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
  }

  if (state === 'reading') {
    return <CircleDot className="h-5 w-5 text-primary" aria-hidden="true" />
  }

  return <Circle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
}

function buildBookMap(books: Book[]) {
  return new Map(
    books
      .map((book) => [book._filename?.replace(/\.md$/, '') ?? '', book] as const)
      .filter(([slug]) => slug.length > 0),
  )
}
