import fs from 'fs/promises'
import type { StorageContext } from '@/lib/storage/context'
import { getLibraryDir } from '@/lib/books/library-service'

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
  try {
    const files = await fs.readdir(getLibraryDir(context))
    return new Set(files.filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, '')))
  } catch {
    return new Set()
  }
}
