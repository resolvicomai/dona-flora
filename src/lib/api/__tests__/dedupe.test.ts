import { stripDiacritics, dedupeKey, dedupeBooks } from '../dedupe'
import type { BookSearchResult } from '../google-books'

const book = (overrides: Partial<BookSearchResult> = {}): BookSearchResult => ({
  title: 'Test',
  authors: ['A'],
  source: 'google-books',
  ...overrides,
})

describe('stripDiacritics', () => {
  it('folds NFD combining marks', () => {
    expect(stripDiacritics('Anéis')).toBe('Aneis')
    expect(stripDiacritics('coração')).toBe('coracao')
  })
})

describe('dedupeKey', () => {
  it('prefers ISBN when present', () => {
    expect(dedupeKey(book({ isbn: '978-0-00-000000-0' }))).toBe('isbn:978-0-00-000000-0')
  })
  it('falls back to folded title+author', () => {
    expect(dedupeKey(book({ title: 'O Senhor dos Anéis', authors: ['J.R.R. Tolkien'] }))).toBe(
      'ta:o senhor dos aneis|j.r.r. tolkien',
    )
  })
})

describe('dedupeBooks', () => {
  it('drops later duplicates by ISBN', () => {
    const a = book({ title: 'A', isbn: '1' })
    const b = book({ title: 'A (reprint)', isbn: '1' })
    const out = dedupeBooks([a, b])
    expect(out).toEqual([a])
  })
  it('respects cap', () => {
    const items = [book({ title: 'A' }), book({ title: 'B' }), book({ title: 'C' })]
    expect(dedupeBooks(items, 2)).toHaveLength(2)
  })
})
