import { searchOpenLibrary } from '../open-library'

const MOCK_VALID_RESPONSE = {
  numFound: 1,
  docs: [
    {
      title: 'Fundacao',
      author_name: ['Isaac Asimov'],
      first_publish_year: 1951,
      cover_i: 8765432,
      isbn: ['9780553293357', '0553293354'],
    },
  ],
}

beforeEach(() => jest.restoreAllMocks())

describe('searchOpenLibrary', () => {
  it('parses valid response into BookSearchResult[]', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_VALID_RESPONSE,
    } as Response)

    const results = await searchOpenLibrary('Fundacao')

    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Fundacao')
    expect(results[0].authors).toEqual(['Isaac Asimov'])
    expect(results[0].year).toBe(1951)
    expect(results[0].isbn).toBe('9780553293357')
  })

  it('returns [] when docs is empty', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ numFound: 0, docs: [] }),
    } as Response)

    const results = await searchOpenLibrary('unknownbook12345xyz')
    expect(results).toEqual([])
  })

  it('builds cover URL from cover_i field', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_VALID_RESPONSE,
    } as Response)

    const results = await searchOpenLibrary('Fundacao')
    expect(results[0].cover).toBe('https://covers.openlibrary.org/b/id/8765432-L.jpg')
  })

  it('returns undefined cover when cover_i is absent', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        docs: [{ title: 'Sem Capa', author_name: ['Autor'], first_publish_year: 2000 }],
      }),
    } as Response)

    const results = await searchOpenLibrary('Sem Capa')
    expect(results[0].cover).toBeUndefined()
  })

  it('includes User-Agent header in request', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ docs: [] }),
    } as Response)

    await searchOpenLibrary('Fundacao')

    const calledInit = fetchSpy.mock.calls[0][1] as RequestInit
    const headers = calledInit?.headers as Record<string, string>
    expect(headers?.['User-Agent']).toBe('DonaFlora/1.0 (personal book catalog)')
  })

  it('throws on non-OK response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 503,
    } as Response)

    await expect(searchOpenLibrary('Fundacao')).rejects.toThrow('[OpenLibrary] API error: 503')
  })
})
