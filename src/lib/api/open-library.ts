import type { BookSearchResult } from './google-books'
import { stripDiacritics, dedupeKey } from './dedupe'
import {
  matchesBookLanguageFilter,
  normalizeBookLanguageFilter,
} from '@/lib/books/language'
import { normalizeISBN } from '@/lib/books/isbn'

const OPEN_LIBRARY_API = 'https://openlibrary.org/search.json'

function pickOpenLibraryLanguage(
  languages: string[] | undefined,
  filter?: string,
) {
  if (!languages || languages.length === 0) {
    return undefined
  }

  const normalizedFilter = normalizeBookLanguageFilter(filter)
  if (normalizedFilter === 'all') {
    return languages[0]
  }

  return (
    languages.find((language) =>
      matchesBookLanguageFilter(language, normalizedFilter),
    ) ?? languages[0]
  )
}

async function fetchOnce(
  query: string,
  limit: number,
  page: number,
  languageFilter?: string,
): Promise<BookSearchResult[]> {
  const isbnQuery = normalizeISBN(query)
  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page),
    fields:
      'title,subtitle,author_name,first_publish_year,cover_i,isbn,language,publisher',
  })

  if (isbnQuery) {
    params.set('isbn', isbnQuery.value)
  } else {
    params.set('q', query)
  }

  const res = await fetch(`${OPEN_LIBRARY_API}?${params}`, {
    headers: { 'User-Agent': 'DonaFlora/1.0 (personal book catalog)' },
  })
  // Open Library rejects very short queries (e.g. "cs") with HTTP 422.
  // Treat that provider-level validation as "no matches here" so the app
  // can keep the search surface calm instead of surfacing a hard error.
  if (res.status === 422) {
    return []
  }
  if (!res.ok) {
    throw new Error(`[OpenLibrary] API error: ${res.status}`)
  }
  const data = await res.json()
  return (data.docs ?? []).map(
    (doc: {
      title?: string
      subtitle?: string
      author_name?: string[]
      isbn?: string[]
      cover_i?: number
      first_publish_year?: number
      language?: string[]
      publisher?: string[]
    }) =>
      {
        const normalizedISBNs =
          doc.isbn
            ?.map((value) => normalizeISBN(value))
            .filter((value) => value !== null) ?? []
        const isbn13 = normalizedISBNs.find(
          (isbn) => isbn.kind === 'isbn_13',
        )?.value
        const isbn10 = normalizedISBNs.find(
          (isbn) => isbn.kind === 'isbn_10',
        )?.value
        const cover = doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
          : undefined

        const language = pickOpenLibraryLanguage(doc.language, languageFilter)

        return {
          title: doc.title ?? '',
          authors: doc.author_name ?? [],
          isbn: isbn13 ?? isbn10 ?? doc.isbn?.[0],
          isbn10,
          isbn13,
          subtitle: doc.subtitle,
          publisher: doc.publisher?.[0],
          cover,
          coverSource: cover ? 'open-library' : undefined,
          source: 'open-library',
          year: doc.first_publish_year,
          language,
        } satisfies BookSearchResult
      }
  )
}

export async function searchOpenLibrary(
  query: string,
  limit = 5,
  page = 1,
  language?: string,
): Promise<BookSearchResult[]> {
  if (query.trim().length < 3) {
    return []
  }

  const stripped = stripDiacritics(query)
  const variants = stripped === query ? [query] : [query, stripped]

  const settled = await Promise.allSettled(
    variants.map((v) => fetchOnce(v, limit, page, language))
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
    if (!matchesBookLanguageFilter(book.language, language)) continue

    const key = dedupeKey(book)
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(book)
    if (merged.length >= limit) break
  }
  return merged
}
