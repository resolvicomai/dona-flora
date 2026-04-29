export interface NormalizedISBN {
  isbn?: string
  isbn_10?: string
  isbn_13?: string
}

export function normalizeISBN(raw: string | undefined | null) {
  if (!raw) {
    return null
  }

  const value = raw.replace(/[-\s]/g, '').toUpperCase()

  if (/^\d{13}$/.test(value)) {
    return { kind: 'isbn_13' as const, value }
  }

  if (/^\d{9}[\dX]$/.test(value)) {
    return { kind: 'isbn_10' as const, value }
  }

  return null
}

export function splitLegacyISBN(input: {
  isbn?: string
  isbn_10?: string
  isbn_13?: string
}): NormalizedISBN {
  const normalized: NormalizedISBN = {
    isbn: input.isbn,
    isbn_10: input.isbn_10,
    isbn_13: input.isbn_13,
  }

  if (!normalized.isbn_10) {
    const isbn10 = normalizeISBN(input.isbn_10)
    if (isbn10?.kind === 'isbn_10') {
      normalized.isbn_10 = isbn10.value
    }
  }

  if (!normalized.isbn_13) {
    const isbn13 = normalizeISBN(input.isbn_13)
    if (isbn13?.kind === 'isbn_13') {
      normalized.isbn_13 = isbn13.value
    }
  }

  const legacy = normalizeISBN(input.isbn)
  if (legacy?.kind === 'isbn_10' && !normalized.isbn_10) {
    normalized.isbn_10 = legacy.value
  }
  if (legacy?.kind === 'isbn_13' && !normalized.isbn_13) {
    normalized.isbn_13 = legacy.value
  }

  return normalized
}
