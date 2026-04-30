import type { StorageContext } from '@/lib/storage/context'
import { getBookAuthorsDisplay } from '@/lib/books/authors'
import { parseHighlights } from '@/lib/books/highlights'
import { loadLibrarySnapshot } from './snapshot'

const MAX_HIGHLIGHTS_PER_BOOK = 5

function truncate(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`
}

/**
 * Reads every `.md` file in `data/books` (or `process.env.LIBRARY_DIR`), parses its
 * frontmatter with the CVE-2025-65108 mitigation reused from `library-service.ts`,
 * and produces a single string used as the `<LIBRARY>` block in the system prompt.
 *
 * The output is lexically sorted so the prefix stays stable across requests — this
 * is a requirement for Anthropic prompt caching (see AI-SPEC §4, lines 466-495 and 641).
 *
 * Malformed files are skipped with `console.warn` (never throws) — same contract as
 * `listBooks()` in `library-service.ts`.
 */
export async function loadLibraryContext(context?: StorageContext): Promise<string> {
  const snapshot = await loadLibrarySnapshot(context)
  const entries: string[] = []

  for (const diagnostic of snapshot.diagnostics) {
    const target = diagnostic.filename ?? diagnostic.filepath ?? 'acervo'
    console.warn(`[LibraryContext] ${diagnostic.kind} in ${target}:`, diagnostic.message)
  }

  for (const book of snapshot.books) {
    const slug = book._filename?.replace(/\.md$/, '') ?? ''
    const notesTrim = book._notes.trim()
    const highlights = parseHighlights(book._notes).slice(0, MAX_HIGHLIGHTS_PER_BOOK)
    const parts: (string | null)[] = [
      `### ${book.title} — ${getBookAuthorsDisplay(book.author)}`,
      `slug: ${slug}`,
      `status: ${book.status}`,
      book.rating != null ? `rating: ${book.rating}/5` : null,
      book.subtitle ? `subtitle: ${book.subtitle}` : null,
      book.genre ? `genre: ${book.genre}` : null,
      book.publisher ? `publisher: ${book.publisher}` : null,
      book.tags && book.tags.length > 0 ? `tags: ${book.tags.join(', ')}` : null,
      notesTrim ? `notes: ${notesTrim.slice(0, 400)}` : null,
      highlights.length > 0
        ? `highlights:\n${highlights
            .map((highlight) => {
              const page = highlight.page != null ? `p.${highlight.page}: ` : ''
              const note = highlight.note ? ` — ${truncate(highlight.note, 160)}` : ''
              return `- ${page}"${truncate(highlight.quote, 240)}"${note}`
            })
            .join('\n')}`
        : null,
    ]
    entries.push(parts.filter((p): p is string => p !== null).join('\n'))
  }

  // Stable sort: keeps the prompt-cache prefix deterministic.
  return entries.sort().join('\n\n')
}
