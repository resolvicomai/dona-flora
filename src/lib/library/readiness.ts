import { loadLibraryContext } from '@/lib/library/context'
import { loadLibrarySnapshot } from '@/lib/library/snapshot'
import type { StorageContext } from '@/lib/storage/context'

export async function buildLibraryReadinessReport(context: StorageContext) {
  const [snapshot, libraryContext] = await Promise.all([
    loadLibrarySnapshot(context),
    loadLibraryContext(context),
  ])

  return {
    bookCount: snapshot.books.length,
    contextChars: libraryContext.length,
    indexedAt: new Date().toISOString(),
    ok: true,
  }
}
