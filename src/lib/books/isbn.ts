export interface NormalizedISBN {
  isbn?: string
  isbn_10?: string
  isbn_13?: string
}

function hasValidISBN10Checksum(value: string) {
  const sum = [...value].reduce((total, char, index) => {
    const digit = char === 'X' ? 10 : Number(char)
    return total + digit * (10 - index)
  }, 0)

  return sum % 11 === 0
}

function hasValidISBN13Checksum(value: string) {
  const digits = [...value].map(Number)
  const sum = digits
    .slice(0, 12)
    .reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 1 : 3), 0)
  const check = (10 - (sum % 10)) % 10

  return check === digits[12]
}

export function normalizeISBN(raw: string | undefined | null) {
  if (!raw) {
    return null
  }

  const value = raw.replace(/[-\s]/g, '').toUpperCase()

  if (/^\d{13}$/.test(value) && hasValidISBN13Checksum(value)) {
    return { kind: 'isbn_13' as const, value }
  }

  if (/^\d{9}[\dX]$/.test(value) && hasValidISBN10Checksum(value)) {
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
