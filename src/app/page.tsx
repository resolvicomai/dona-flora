import { unstable_noStore as noStore } from 'next/cache'
import { Suspense } from 'react'

import { listBooks } from '@/lib/books/library-service'
import { AddBookDialog } from '@/components/add-book-dialog'
import { BookBrowser } from '@/components/book-browser'
import { ChatHeaderEntryButton } from '@/components/chat/chat-header-entry-button'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  noStore()
  const books = await listBooks()

  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm px-4 py-3 md:px-8">
        <h1 className="text-xl font-semibold text-zinc-100">Dona Flora</h1>
        <div className="flex items-center gap-2">
          <AddBookDialog />
          <ChatHeaderEntryButton />
        </div>
      </header>
      <Suspense fallback={null}>
        <BookBrowser initialBooks={books} />
      </Suspense>
    </main>
  )
}
