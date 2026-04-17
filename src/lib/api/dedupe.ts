import type { BookSearchResult } from './google-books'

export function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function dedupeKey(b: BookSearchResult): string {
  if (b.isbn) return `isbn:${b.isbn}`
  const title = stripDiacritics(b.title.toLowerCase()).replace(/\s+/g, ' ').trim()
  const author = stripDiacritics((b.authors[0] ?? '').toLowerCase()).trim()
  return `ta:${title}|${author}`
}

/**
 * Order-preserving dedupe: first occurrence wins.
 * Optional cap limits output length (used by searchOpenLibrary and AddBookDialog).
 */
export function dedupeBooks(
  input: BookSearchResult[],
  cap?: number,
): BookSearchResult[] {
  const seen = new Set<string>()
  const out: BookSearchResult[] = []
  for (const book of input) {
    const key = dedupeKey(book)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(book)
    if (cap != null && out.length >= cap) break
  }
  return out
}
