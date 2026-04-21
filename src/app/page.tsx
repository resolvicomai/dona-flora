import { unstable_noStore as noStore } from 'next/cache'
import { Suspense } from 'react'

import { listBooks } from '@/lib/books/library-service'
import {
  getSessionStorageContext,
  requireVerifiedServerSession,
} from '@/lib/auth/server'
import { BookBrowser } from '@/components/book-browser'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  noStore()
  const session = await requireVerifiedServerSession()
  const books = await listBooks(getSessionStorageContext(session))

  return (
    <Suspense fallback={null}>
      <BookBrowser initialBooks={books} />
    </Suspense>
  )
}
