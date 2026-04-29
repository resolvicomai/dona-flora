import { normalizeISBN, splitLegacyISBN } from '../isbn'

describe('ISBN normalization', () => {
  it('normalizes ISBN-10 and ISBN-13 strings', () => {
    expect(normalizeISBN('0-553-29335-4')).toEqual({
      kind: 'isbn_10',
      value: '0553293354',
    })
    expect(normalizeISBN('978-0-553-29335-7')).toEqual({
      kind: 'isbn_13',
      value: '9780553293357',
    })
  })

  it('splits legacy isbn into isbn_10 or isbn_13 without removing legacy value', () => {
    expect(splitLegacyISBN({ isbn: '978-0-553-29335-7' })).toEqual({
      isbn: '978-0-553-29335-7',
      isbn_13: '9780553293357',
      isbn_10: undefined,
    })
  })

  it('returns null for invalid ISBN-like strings', () => {
    expect(normalizeISBN('not-an-isbn')).toBeNull()
  })
})
