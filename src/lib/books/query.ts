import Fuse, { type IFuseOptions } from 'fuse.js'
import type { Book, BookStatus } from './schema'
import { getBookAuthorsDisplay } from './authors'

export interface FilterState {
  status: BookStatus[]
  rating: number[]
  genre: string[]
  q: string
  sort: 'added_at' | 'title' | 'author' | 'rating'
  dir: 'asc' | 'desc'
}

const FUSE_OPTIONS: IFuseOptions<Book> = {
  keys: [
    // Primary identifying fields — heavy weight so "kai fu" matches
    // a Kai-Fu Lee book before it matches anything else in the corpus.
    { name: 'title', weight: 4 },
    { name: 'author', weight: 4 },
    { name: 'subtitle', weight: 2 },
    { name: 'series', weight: 1.5 },
    // Secondary fields — present but never alone enough to surface a book.
    { name: 'translator', weight: 0.5 },
    { name: 'publisher', weight: 0.5 },
    { name: 'tags', weight: 0.8 },
    // Long-form notes have very low weight: searching by free-text inside
    // notes is useful as a fallback ("aquele livro em que escrevi sobre X")
    // but should never outrank a real title/author hit.
    { name: '_notes', weight: 0.2 },
  ],
  // Threshold tuning: 0.4 (the previous value) was loose enough that a
  // 2-char overlap inside a long _notes string surfaced unrelated books.
  // 0.3 was tight enough to break "missing accents" tolerance ("senhor
  // aneis" → "O Senhor dos Anéis"). 0.35 keeps the diacritic / typo /
  // missing-stopword cases working while pruning the random hits.
  threshold: 0.35,
  ignoreLocation: true,
  ignoreDiacritics: true,
  // 3 chars avoids the "any short token bats anything" failure mode while
  // still allowing common queries like "ia", "rh", or "uk" against tags.
  minMatchCharLength: 3,
  includeScore: false,
  // CRITICAL: order results by relevance score. With `shouldSort: false`
  // Fuse returned matches in the original library order, so the best hit
  // for "kai fu" could appear after twelve weaker matches — making the
  // search feel broken.
  shouldSort: true,
}

/**
 * Fold a genre string to its canonical key: NFD-normalized, diacritics stripped,
 * lowercased, trimmed. Used both for genre filter matching and dedupe.
 */
export function foldGenre(s: string | undefined): string {
  if (!s) return ''
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

/**
 * Build the list of distinct genres present in the corpus, deduped by their
 * folded key. The label preserves the casing of the first occurrence seen,
 * and the result is sorted by label using pt-BR collation.
 */
export function extractGenres(books: Book[]): Array<{ key: string; label: string }> {
  const seen = new Map<string, string>()
  for (const b of books) {
    const key = foldGenre(b.genre)
    if (!key) continue
    if (!seen.has(key)) seen.set(key, b.genre!)
  }
  return Array.from(seen, ([key, label]) => ({ key, label })).sort((a, b) =>
    a.label.localeCompare(b.label, 'pt-BR'),
  )
}

/**
 * Build a Fuse.js index over the given books using the standard
 * weighted key configuration (title=3, author=2, _notes=1) and
 * diacritic-insensitive matching. Callers should memoize this per
 * `books` reference — rebuilding on every render is expensive.
 */
export function createFuse(books: Book[]): Fuse<Book> {
  return new Fuse(books, FUSE_OPTIONS)
}

/**
 * Apply structural filters (status, rating, genre) to the corpus.
 * - Between filter types: AND (must satisfy every non-empty type).
 * - Within a filter type: OR (any value in the array matches).
 * - Rating is EXACT match: `rating: [4]` excludes books with rating=3 or rating=null.
 */
export function applyFilters(books: Book[], f: FilterState): Book[] {
  return books.filter((b) => {
    if (f.status.length > 0 && !f.status.includes(b.status)) return false
    if (f.rating.length > 0 && (b.rating == null || !f.rating.includes(b.rating))) return false
    if (f.genre.length > 0 && !f.genre.includes(foldGenre(b.genre))) return false
    return true
  })
}

/**
 * Apply a fuzzy search on top of an already-filtered list.
 * The Fuse index is built once for the entire corpus, but results are
 * intersected with `books` so combined filter+search respects the filter set.
 * Empty/whitespace-only queries short-circuit to return `books` unchanged.
 */
export function applySearch(fuse: Fuse<Book>, books: Book[], q: string): Book[] {
  const trimmed = q.trim()
  if (!trimmed) return books
  const allowed = new Set(books.map((b) => b._filename).filter((f): f is string => Boolean(f)))
  return fuse
    .search(trimmed)
    .map((r) => r.item)
    .filter((b) => !b._filename || allowed.has(b._filename))
}

/**
 * Sort a list of books by the given key and direction.
 *
 * - `title` / `author` use pt-BR locale collation (so 'Árvore' sits among 'A' entries).
 * - `added_at` uses lexicographic string compare (ISO YYYY-MM-DD sorts correctly).
 * - `rating` uses `a.rating ?? 0` which places null ratings LAST for `desc` and
 *   FIRST for `asc`. This is acceptable for a personal library where null
 *   rating means "no opinion yet"; rating is not shown in the listing (D-01).
 */
export function applySort(
  books: Book[],
  sort: FilterState['sort'],
  dir: FilterState['dir'],
): Book[] {
  const mul = dir === 'asc' ? 1 : -1
  const cmp: Record<FilterState['sort'], (a: Book, b: Book) => number> = {
    added_at: (a, b) => (a.added_at || '').localeCompare(b.added_at || '') * mul,
    title: (a, b) => a.title.localeCompare(b.title, 'pt-BR') * mul,
    author: (a, b) =>
      getBookAuthorsDisplay(a).localeCompare(getBookAuthorsDisplay(b), 'pt-BR') * mul,
    rating: (a, b) => ((a.rating ?? 0) - (b.rating ?? 0)) * mul,
  }
  return [...books].sort(cmp[sort])
}
