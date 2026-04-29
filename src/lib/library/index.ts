import { listBooks } from '@/lib/books/library-service'
import { loadLibraryContext } from '@/lib/library/context'
import type { StorageContext } from '@/lib/storage/context'

export async function buildLibraryReadinessReport(context: StorageContext) {
  const [books, libraryContext] = await Promise.all([
    listBooks(context),
    loadLibraryContext(context),
  ])

  return {
    bookCount: books.length,
    contextChars: libraryContext.length,
    indexedAt: new Date().toISOString(),
    ok: true,
  }
}
