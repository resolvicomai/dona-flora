const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes'

export interface BookSearchResult {
  title: string
  authors: string[]
  isbn?: string
  synopsis?: string
  cover?: string
  genre?: string
  year?: number
}

function isIsbnQuery(q: string): boolean {
  const digits = q.replace(/[-\s]/g, '')
  return /^\d{10}$/.test(digits) || /^\d{13}$/.test(digits)
}

export async function searchGoogleBooks(
  query: string,
  maxResults = 5
): Promise<BookSearchResult[]> {
  const q = isIsbnQuery(query)
    ? `isbn:${query.replace(/[-\s]/g, '')}`
    : query
  const params = new URLSearchParams({
    q,
    maxResults: String(maxResults),
  })

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY
  if (apiKey) {
    params.set('key', apiKey)
  }

  const res = await fetch(`${GOOGLE_BOOKS_API}?${params}`)
  if (!res.ok) {
    throw new Error(`[GoogleBooks] API error: ${res.status}`)
  }

  const data = await res.json()
  return (data.items ?? []).map((item: any) => {
    const v = item.volumeInfo ?? {}
    const isbn = v.industryIdentifiers?.find(
      (id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
    )
    return {
      title: v.title ?? '',
      authors: v.authors ?? [],
      isbn: isbn?.identifier,
      synopsis: v.description,
      cover: v.imageLinks?.thumbnail?.replace('http://', 'https://'),
      genre: v.categories?.[0],
      year: v.publishedDate
        ? parseInt(v.publishedDate.slice(0, 4), 10) || undefined
        : undefined,
    } satisfies BookSearchResult
  })
}
