import { unstable_noStore as noStore } from 'next/cache'
import { Suspense } from 'react'

import { listBooks } from '@/lib/books/library-service'
import { BookBrowser } from '@/components/book-browser'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  noStore()
  const books = await listBooks()

  return (
    <Suspense fallback={null}>
      <BookBrowser initialBooks={books} />
    </Suspense>
  )
}
