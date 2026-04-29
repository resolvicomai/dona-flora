import {
  matchesBookLanguageFilter,
  resolveGoogleBooksLanguageRestrict,
} from '@/lib/books/language'
import { normalizeISBN } from '@/lib/books/isbn'

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes'

interface GoogleBooksIndustryIdentifier {
  identifier?: string
  type?: string
}

interface GoogleBooksVolumeInfo {
  authors?: string[]
  categories?: string[]
  description?: string
  imageLinks?: {
    thumbnail?: string
  }
  industryIdentifiers?: GoogleBooksIndustryIdentifier[]
  language?: string
  publishedDate?: string
  publisher?: string
  subtitle?: string
  title?: string
}

interface GoogleBooksItem {
  volumeInfo?: GoogleBooksVolumeInfo
}

interface GoogleBooksResponse {
  items?: GoogleBooksItem[]
}

export interface BookSearchResult {
  title: string
  authors: string[]
  isbn?: string
  isbn10?: string
  isbn13?: string
  subtitle?: string
  publisher?: string
  synopsis?: string
  synopsisSource?: string
  cover?: string
  coverSource?: 'google-books' | 'open-library' | 'amazon'
  genre?: string
  source: 'google-books' | 'open-library' | 'vision-import'
  year?: number
  language?: string
}

function isIsbnQuery(q: string): boolean {
  const digits = q.replace(/[-\s]/g, '')
  return /^\d{10}$/.test(digits) || /^\d{13}$/.test(digits)
}

export async function searchGoogleBooks(
  query: string,
  maxResults = 5,
  startIndex = 0,
  language?: string,
): Promise<BookSearchResult[]> {
  const q = isIsbnQuery(query)
    ? `isbn:${query.replace(/[-\s]/g, '')}`
    : query
  const params = new URLSearchParams({
    q,
    maxResults: String(maxResults),
    startIndex: String(startIndex),
  })
  const langRestrict = resolveGoogleBooksLanguageRestrict(language)

  if (langRestrict) {
    params.set('langRestrict', langRestrict)
  }

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY
  if (apiKey) {
    params.set('key', apiKey)
  }

  const res = await fetch(`${GOOGLE_BOOKS_API}?${params}`)
  if (!res.ok) {
    throw new Error(`[GoogleBooks] API error: ${res.status}`)
  }

  const data = (await res.json()) as GoogleBooksResponse
  return (data.items ?? [])
    .map((item) => {
      const v = item.volumeInfo ?? {}
      const normalizedIdentifiers =
        v.industryIdentifiers
          ?.map((id) => ({
            ...id,
            normalized: normalizeISBN(id.identifier),
          }))
          .filter((id) => id.normalized !== null) ?? []
      const isbn13 = normalizedIdentifiers.find(
        (id) => id.normalized?.kind === 'isbn_13',
      )?.normalized?.value
      const isbn10 = normalizedIdentifiers.find(
        (id) => id.normalized?.kind === 'isbn_10',
      )?.normalized?.value
      const cover = v.imageLinks?.thumbnail?.replace('http://', 'https://')
      return {
        title: v.title ?? '',
        authors: v.authors ?? [],
        isbn: isbn13 ?? isbn10,
        isbn10,
        isbn13,
        subtitle: v.subtitle,
        publisher: v.publisher,
        synopsis: v.description,
        synopsisSource: v.description ? 'Google Books' : undefined,
        cover,
        coverSource: cover ? 'google-books' : undefined,
        genre: v.categories?.[0],
        source: 'google-books',
        year: v.publishedDate
          ? parseInt(v.publishedDate.slice(0, 4), 10) || undefined
          : undefined,
        language: v.language,
      } satisfies BookSearchResult
    })
    .filter((book) => matchesBookLanguageFilter(book.language, language))
}
