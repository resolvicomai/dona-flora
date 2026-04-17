import type { BookSearchResult } from './google-books'
import { stripDiacritics, dedupeKey } from './dedupe'

const OPEN_LIBRARY_API = 'https://openlibrary.org/search.json'

async function fetchOnce(
  query: string,
  limit: number,
  page: number
): Promise<BookSearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    page: String(page),
    fields: 'title,author_name,first_publish_year,cover_i,isbn',
  })
  const res = await fetch(`${OPEN_LIBRARY_API}?${params}`, {
    headers: { 'User-Agent': 'DonaFlora/1.0 (personal book catalog)' },
  })
  if (!res.ok) {
    throw new Error(`[OpenLibrary] API error: ${res.status}`)
  }
  const data = await res.json()
  return (data.docs ?? []).map(
    (doc: {
      title?: string
      author_name?: string[]
      isbn?: string[]
      cover_i?: number
      first_publish_year?: number
    }) =>
      ({
        title: doc.title ?? '',
        authors: doc.author_name ?? [],
        isbn: doc.isbn?.[0],
        cover: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
          : undefined,
        year: doc.first_publish_year,
      }) satisfies BookSearchResult
  )
}

export async function searchOpenLibrary(
  query: string,
  limit = 5,
  page = 1
): Promise<BookSearchResult[]> {
  const stripped = stripDiacritics(query)
  const variants = stripped === query ? [query] : [query, stripped]

  const settled = await Promise.allSettled(
    variants.map((v) => fetchOnce(v, limit, page))
  )
  const successes = settled
    .filter(
      (r): r is PromiseFulfilledResult<BookSearchResult[]> =>
        r.status === 'fulfilled'
    )
    .flatMap((r) => r.value)

  if (successes.length === 0) {
    const firstError = settled.find((r) => r.status === 'rejected')
    if (firstError && firstError.status === 'rejected') {
      throw firstError.reason
    }
  }

  const seen = new Set<string>()
  const merged: BookSearchResult[] = []
  for (const book of successes) {
    const key = dedupeKey(book)
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(book)
    if (merged.length >= limit) break
  }
  return merged
}
