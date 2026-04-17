import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { listBooks } from '@/lib/books/library-service'
import { listChats } from '@/lib/chats/list'
import { loadChat } from '@/lib/chats/store'
import { ChatShell } from '@/components/chat/chat-shell'
import type { ChatBookMeta } from '@/components/chat/known-library-context'

export const dynamic = 'force-dynamic'

/**
 * /chat/[id] entry — existing conversation by id.
 *
 * `loadChat(id)` already runs path.join(getChatsDir(), `${id}.md`); Next.js
 * decodes dynamic segments and rejects `/` characters, so `..` path traversal
 * attempts produce ENOENT and are surfaced as 404s here (T-04-21 mitigation).
 * No seedBook: an existing conversation does not need the deep-link seed.
 */
export default async function ChatIdPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  noStore()
  const { id } = await params
  const messages = await loadChat(id)
  if (!messages) notFound()

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

  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm px-4 py-3 md:px-8">
        <h1 className="text-xl font-semibold text-zinc-100">Dona Flora</h1>
      </header>
      <Suspense fallback={null}>
        <ChatShell
          chatId={id}
          initialMessages={messages}
          chats={chats}
          knownBooks={knownBooks}
          bookCount={books.length}
          seedBook={null}
        />
      </Suspense>
    </main>
  )
}
