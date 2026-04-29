import type { Book } from '@/lib/books/schema'

export function normalizeAuthors(value: string | string[] | undefined | null) {
  if (!value) {
    return []
  }

  return (Array.isArray(value) ? value : [value])
    .map((author) => author.trim())
    .filter(Boolean)
}

export function getBookAuthorsDisplay(
  bookOrAuthors: Pick<Book, 'author'> | string | string[] | undefined | null,
) {
  const authors =
    typeof bookOrAuthors === 'object' &&
    bookOrAuthors !== null &&
    'author' in bookOrAuthors
      ? bookOrAuthors.author
      : bookOrAuthors

  const normalized = normalizeAuthors(authors)

  if (normalized.length === 0) {
    return 'Autor desconhecido'
  }

  return normalized.join(', ')
}

export function getBookPrimaryAuthor(
  bookOrAuthors: Pick<Book, 'author'> | string | string[] | undefined | null,
) {
  return normalizeAuthors(
    typeof bookOrAuthors === 'object' &&
      bookOrAuthors !== null &&
      'author' in bookOrAuthors
      ? bookOrAuthors.author
      : bookOrAuthors,
  )[0] ?? ''
}
