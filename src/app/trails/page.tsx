import Link from 'next/link'
import { unstable_noStore as noStore } from 'next/cache'
import { ArrowRight, MapIcon, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/books/status-badge'
import { getBookAuthorsDisplay } from '@/lib/books/authors'
import { listBooks } from '@/lib/books/library-service'
import type { Book } from '@/lib/books/schema'
import { getSessionStorageContext, requireVerifiedServerSession } from '@/lib/auth/server'
import { getUserSettings } from '@/lib/auth/db'
import { listTrails, type TrailRecord } from '@/lib/trails/store'
import type { AppLanguage } from '@/lib/i18n/app-language'

export const dynamic = 'force-dynamic'

const COPY: Record<
  AppLanguage,
  {
    addTrail: string
    body: string
    emptyBody: string
    emptyTitle: string
    eyebrow: string
    missingBook: string
    open: string
    progress: (done: number, total: number) => string
    title: string
  }
> = {
  'pt-BR': {
    addTrail: 'Pedir uma trilha',
    body: 'Trilhas salvas pela Dona Flora ficam aqui. O progresso vem do status real dos livros: quando você marca um livro como lendo ou lido, a trilha acompanha.',
    emptyBody:
      'Peça no chat algo como “monte uma trilha sobre tecnologia e poder” e salve a sugestão quando fizer sentido.',
    emptyTitle: 'Nenhuma trilha salva ainda.',
    eyebrow: 'Trilhas',
    missingBook: 'Livro não encontrado no acervo',
    open: 'Abrir trilha',
    progress: (done, total) => `${done}/${total} lidos`,
    title: 'Acompanhe seus caminhos de leitura.',
  },
  en: {
    addTrail: 'Ask for a trail',
    body: 'Trails saved by Dona Flora live here. Progress comes from the real book status: when you mark a book as reading or read, the trail follows.',
    emptyBody:
      'Ask in chat for something like “build a trail about technology and power” and save the suggestion when it makes sense.',
    emptyTitle: 'No saved trails yet.',
    eyebrow: 'Trails',
    missingBook: 'Book not found in library',
    open: 'Open trail',
    progress: (done, total) => `${done}/${total} read`,
    title: 'Follow your reading paths.',
  },
  es: {
    addTrail: 'Pedir una ruta',
    body: 'Las rutas guardadas por Dona Flora quedan aquí. El progreso viene del estado real de los libros: cuando marcas un libro como leyendo o leído, la ruta se actualiza.',
    emptyBody:
      'Pide en el chat algo como “monta una ruta sobre tecnología y poder” y guarda la sugerencia cuando tenga sentido.',
    emptyTitle: 'Aún no hay rutas guardadas.',
    eyebrow: 'Rutas',
    missingBook: 'Libro no encontrado en la biblioteca',
    open: 'Abrir ruta',
    progress: (done, total) => `${done}/${total} leídos`,
    title: 'Sigue tus caminos de lectura.',
  },
  'zh-CN': {
    addTrail: '请求阅读路径',
    body: 'Dona Flora 保存的阅读路径会出现在这里。进度来自真实的图书状态：当你把书标为在读或已读，路径会同步更新。',
    emptyBody: '在聊天里请求类似“做一条关于技术与权力的阅读路径”，觉得合适后保存建议。',
    emptyTitle: '还没有保存的路径。',
    eyebrow: '路径',
    missingBook: '书库中找不到这本书',
    open: '打开路径',
    progress: (done, total) => `已读 ${done}/${total}`,
    title: '跟进你的阅读路径。',
  },
}

type BookBySlug = Map<string, Book>

export default async function TrailsPage() {
  noStore()
  const session = await requireVerifiedServerSession()
  const storageContext = getSessionStorageContext(session)
  const [books, trails, settings] = await Promise.all([
    listBooks(storageContext),
    listTrails(storageContext),
    Promise.resolve(getUserSettings(session.user.id)),
  ])
  const copy = COPY[settings.language]
  const bookBySlug = buildBookMap(books)

  return (
    <div className="page-frame flex flex-1 flex-col gap-7 pt-7 md:gap-9 md:pt-9">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 className="hero-title mt-5 max-w-4xl text-balance text-foreground">{copy.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">{copy.body}</p>
        </div>
        <div className="brand-guide flex flex-col gap-4 p-5">
          <MapIcon className="h-6 w-6 text-primary" aria-hidden="true" />
          <p className="text-sm leading-6 text-muted-foreground">{copy.emptyBody}</p>
          <Button render={<Link href="/chat" />} className="w-fit">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            {copy.addTrail}
          </Button>
        </div>
      </section>

      {trails.length === 0 ? (
        <section className="brand-window flex min-h-[22rem] flex-col items-center justify-center gap-4 p-8 text-center">
          <MapIcon className="h-9 w-9 text-muted-foreground" aria-hidden="true" />
          <h2 className="section-title text-foreground">{copy.emptyTitle}</h2>
          <p className="max-w-lg text-sm leading-7 text-muted-foreground">{copy.emptyBody}</p>
          <Button render={<Link href="/chat" />}>{copy.addTrail}</Button>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trails.map((trail) => (
            <TrailCard
              key={trail.slug}
              trail={trail}
              bookBySlug={bookBySlug}
              copy={copy}
              locale={settings.language}
            />
          ))}
        </section>
      )}
    </div>
  )
}

function TrailCard({
  bookBySlug,
  copy,
  locale,
  trail,
}: {
  bookBySlug: BookBySlug
  copy: (typeof COPY)[AppLanguage]
  locale: AppLanguage
  trail: TrailRecord
}) {
  const stats = getTrailStats(trail, bookBySlug)
  const percent = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  return (
    <article className="brand-window flex min-h-[24rem] flex-col overflow-hidden">
      <div className="border-b border-hairline p-5">
        <p className="eyebrow">{copy.progress(stats.done, stats.total)}</p>
        <h2 className="mt-3 text-2xl font-semibold leading-tight text-foreground">{trail.title}</h2>
        {trail.goal ? (
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{trail.goal}</p>
        ) : null}
        <div className="mt-5 h-2 overflow-hidden rounded-full border border-hairline bg-surface-strong">
          <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <ol className="flex flex-1 flex-col divide-y divide-hairline">
        {trail.book_refs.slice(0, 4).map((slug, index) => {
          const book = bookBySlug.get(slug)
          return (
            <li key={`${slug}-${index}`} className="flex gap-3 p-4">
              <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-hairline font-mono text-xs font-medium">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                {book ? (
                  <>
                    <p className="truncate text-sm font-semibold text-foreground">{book.title}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {getBookAuthorsDisplay(book)}
                    </p>
                    <StatusBadge status={book.status} locale={locale} className="mt-2" />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{copy.missingBook}</p>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      <div className="border-t border-hairline p-4">
        <Button
          render={<Link href={`/trails/${trail.slug}`} />}
          variant="outline"
          className="w-full justify-between"
        >
          {copy.open}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </article>
  )
}

function buildBookMap(books: Book[]): BookBySlug {
  return new Map(
    books
      .map((book) => [book._filename?.replace(/\.md$/, '') ?? '', book] as const)
      .filter(([slug]) => slug.length > 0),
  )
}

function getTrailStats(trail: TrailRecord, bookBySlug: BookBySlug) {
  const total = trail.book_refs.length
  const done = trail.book_refs.filter((slug) => bookBySlug.get(slug)?.status === 'lido').length

  return { done, total }
}
