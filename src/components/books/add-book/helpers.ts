import type { BookSearchResult } from '@/lib/api/google-books'
import { normalizeISBN } from '@/lib/books/isbn'
import type { AddBookCopy } from './copy'

export function formatAuthors(authors: string[], copy: AddBookCopy): string {
  if (authors.length === 0) return copy.unknownAuthor
  if (authors.length <= 2) return authors.join(', ')
  return `${authors[0]}, ${authors[1]} ${copy.andMoreAuthors}${authors.length - 2}`
}

export function metadataSourceLabel(source: BookSearchResult['source'], copy: AddBookCopy) {
  if (source === 'google-books') return copy.metadataSource.googleBooks
  if (source === 'open-library') return copy.metadataSource.openLibrary
  return copy.metadataSource.visionImport
}

export async function getSearchErrorMessage(response: Response, copy: AddBookCopy) {
  const payload = (await response.json().catch(() => null)) as {
    error?: string
  } | null

  return payload?.error ?? copy.searchError
}

export function normalizeManualISBN(value: string) {
  const normalized = normalizeISBN(value)
  if (!normalized) return {}

  if (normalized.kind === 'isbn_13') {
    return { isbn_13: normalized.value }
  }

  return { isbn_10: normalized.value }
}

export function getValidISBNFromQuery(query: string) {
  return normalizeISBN(query.trim())
}
