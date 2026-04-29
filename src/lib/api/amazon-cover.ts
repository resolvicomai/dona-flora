import { normalizeISBN } from '@/lib/books/isbn'

export const AMAZON_COVER_SOURCE = 'amazon'

export function isbn13ToIsbn10(isbn13Raw: string | undefined | null) {
  const normalized = normalizeISBN(isbn13Raw)
  if (normalized?.kind !== 'isbn_13' || !normalized.value.startsWith('978')) {
    return null
  }

  const body = normalized.value.slice(3, 12)
  let sum = 0
  for (let index = 0; index < body.length; index += 1) {
    sum += (10 - index) * Number(body[index])
  }

  const remainder = 11 - (sum % 11)
  const check =
    remainder === 10 ? 'X' : remainder === 11 ? '0' : String(remainder)

  return `${body}${check}`
}

export function getAmazonCoverUrl(isbn10OrAsin: string) {
  return `https://m.media-amazon.com/images/P/${isbn10OrAsin}.01._SCLZZZZZZZ_.jpg`
}

export function resolveAmazonCoverAsin(input: {
  isbn10?: string
  isbn13?: string
}) {
  const isbn10 = normalizeISBN(input.isbn10)
  if (isbn10?.kind === 'isbn_10') {
    return isbn10.value
  }

  return isbn13ToIsbn10(input.isbn13)
}

export async function findAmazonCoverByISBN(input: {
  isbn10?: string
  isbn13?: string
}) {
  const asin = resolveAmazonCoverAsin(input)
  if (!asin) return null

  const coverUrl = getAmazonCoverUrl(asin)
  try {
    const response = await fetch(coverUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(2500),
    })
    const contentType = response.headers.get('content-type') ?? ''

    if (response.ok && contentType.startsWith('image/')) {
      return coverUrl
    }
  } catch {
    return null
  }

  return null
}
