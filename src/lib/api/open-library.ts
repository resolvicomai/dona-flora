import type { BookSearchResult } from './google-books'

const OPEN_LIBRARY_API = 'https://openlibrary.org/search.json'

export async function searchOpenLibrary(
  query: string,
  limit = 5
): Promise<BookSearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    fields: 'title,author_name,first_publish_year,cover_i,isbn',
  })

  const res = await fetch(`${OPEN_LIBRARY_API}?${params}`, {
    headers: { 'User-Agent': 'DonaFlora/1.0 (personal book catalog)' },
  })
  if (!res.ok) {
    throw new Error(`[OpenLibrary] API error: ${res.status}`)
  }

  const data = await res.json()
  return (data.docs ?? []).map((doc: any) => ({
    title: doc.title ?? '',
    authors: doc.author_name ?? [],
    isbn: doc.isbn?.[0],
    cover: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      : undefined,
    year: doc.first_publish_year,
  } satisfies BookSearchResult))
}
