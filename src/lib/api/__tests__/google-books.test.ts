import { searchGoogleBooks } from '../google-books'

const MOCK_VALID_RESPONSE = {
  items: [
    {
      volumeInfo: {
        title: 'Fundacao',
        authors: ['Isaac Asimov'],
        description: 'Uma saga épica sobre o futuro da humanidade.',
        categories: ['Fiction'],
        imageLinks: {
          thumbnail: 'http://books.google.com/books/content?id=xxx&zoom=1',
        },
        industryIdentifiers: [
          { type: 'ISBN_13', identifier: '9788576570509' },
          { type: 'ISBN_10', identifier: '8576570505' },
        ],
        publishedDate: '2009',
      },
    },
  ],
}

beforeEach(() => jest.restoreAllMocks())

describe('searchGoogleBooks', () => {
  it('parses valid response into BookSearchResult[]', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_VALID_RESPONSE,
    } as Response)

    const results = await searchGoogleBooks('Fundacao')

    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Fundacao')
    expect(results[0].authors).toEqual(['Isaac Asimov'])
    expect(results[0].isbn).toBe('9788576570509')
    expect(results[0].synopsis).toBe('Uma saga épica sobre o futuro da humanidade.')
    expect(results[0].genre).toBe('Fiction')
    expect(results[0].year).toBe(2009)
  })

  it('returns [] when items is null/undefined', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ totalItems: 0 }),
    } as Response)

    const results = await searchGoogleBooks('unknownbook12345')
    expect(results).toEqual([])
  })

  it('converts http:// thumbnail URL to https://', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_VALID_RESPONSE,
    } as Response)

    const results = await searchGoogleBooks('Fundacao')
    expect(results[0].cover).toMatch(/^https:\/\//)
    expect(results[0].cover).not.toMatch(/^http:\/\//)
  })

  it('extracts ISBN_13 preferentially over ISBN_10', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_VALID_RESPONSE,
    } as Response)

    const results = await searchGoogleBooks('Fundacao')
    expect(results[0].isbn).toBe('9788576570509')
  })

  it('prefixes bare ISBN queries with isbn: so Google Books returns a match', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    } as Response)

    await searchGoogleBooks('9786527411819')

    const calledUrl = String(fetchSpy.mock.calls[0][0])
    expect(calledUrl).toContain('q=isbn%3A9786527411819')
  })

  it('strips hyphens and spaces from ISBN before prefixing', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    } as Response)

    await searchGoogleBooks('978-65-274-1181-9')

    const calledUrl = String(fetchSpy.mock.calls[0][0])
    expect(calledUrl).toContain('q=isbn%3A9786527411819')
  })

  it('keeps non-ISBN queries untouched', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    } as Response)

    await searchGoogleBooks('Fundacao')

    const calledUrl = String(fetchSpy.mock.calls[0][0])
    expect(calledUrl).toContain('q=Fundacao')
    expect(calledUrl).not.toContain('isbn%3A')
  })

  it('throws on non-OK response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 403,
    } as Response)

    await expect(searchGoogleBooks('Fundacao')).rejects.toThrow('[GoogleBooks] API error: 403')
  })
})
