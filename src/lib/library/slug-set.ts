import type { StorageContext } from '@/lib/storage/context'
import { loadLibrarySnapshot } from './snapshot'

/**
 * Returns a `Set<string>` containing every slug that exists on disk in `data/books`
 * (or `process.env.LIBRARY_DIR`). A slug is a `.md` filename with the extension
 * stripped.
 *
 * Used by the client-side D-14 guardrail (AI-08): the librarian MAY mention any
 * book, but `tool-render_library_book_card` parts whose `slug` is not in this Set
 * degrade to plain text — protects against slug hallucination.
 *
 * Returns an empty Set when the directory is missing.
 */
export async function loadKnownSlugs(context?: StorageContext): Promise<Set<string>> {
  const snapshot = await loadLibrarySnapshot(context)
  return new Set(
    snapshot.books.flatMap((book) => (book._filename ? [book._filename.replace(/\.md$/, '')] : [])),
  )
}
