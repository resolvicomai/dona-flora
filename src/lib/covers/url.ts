import type { Book } from '@/lib/books/schema'

function safeSlug(slug: string) {
  return /^[a-z0-9][a-z0-9-]*$/i.test(slug) ? slug : null
}

export function getCoverRoute(slug: string | undefined | null) {
  if (!slug) return undefined
  const normalized = slug.replace(/\.md$/, '')
  return safeSlug(normalized) ? `/api/covers/${normalized}` : undefined
}

export function getBookCoverRoute(book: Pick<Book, '_filename'>) {
  return getCoverRoute(book._filename)
}
