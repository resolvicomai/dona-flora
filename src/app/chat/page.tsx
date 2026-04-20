import { unstable_noStore as noStore } from 'next/cache'
import { Suspense } from 'react'
import { listBooks } from '@/lib/books/library-service'
import { listChats } from '@/lib/chats/list'
import { ChatShell } from '@/components/chat/chat-shell'
import type { ChatBookMeta } from '@/components/chat/known-library-context'

export const dynamic = 'force-dynamic'

/**
 * /chat entry — new conversation, optional deep-link seed.
 *
 * Reads the library + chat list server-side (same pattern as
 * src/app/page.tsx). `?about={slug}` is gated through `knownSlugs.has(about)`
 * before it is allowed to flow downstream as a seedBook — unknown slugs are
 * ignored (T-04-22 mitigation). The shell handles deep-link composition; this
 * page only supplies structured data.
 */
export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ about?: string }>
}) {
  noStore()
  const { about } = await searchParams
  const [books, chats] = await Promise.all([listBooks(), listChats()])

  const knownBooks: ChatBookMeta[] = books
    .map((b) => ({
      slug: b._filename?.replace(/\.md$/, '') ?? '',
      title: b.title,
      author: b.author,
      cover: b.cover,
      status: b.status,
    }))
    .filter((b) => b.slug !== '')

  const knownSlugs = new Set(knownBooks.map((b) => b.slug))
  const seed =
    about && knownSlugs.has(about)
      ? knownBooks.find((b) => b.slug === about)
      : undefined
  const seedBook = seed
    ? { slug: seed.slug, title: seed.title, author: seed.author }
    : null

  return (
    <Suspense fallback={null}>
      <ChatShell
        chats={chats}
        knownBooks={knownBooks}
        bookCount={books.length}
        seedBook={seedBook}
      />
    </Suspense>
  )
}
