import { searchOpenLibrary } from '../open-library'

const MOCK_VALID_RESPONSE = {
  numFound: 1,
  docs: [
    {
      title: 'Fundacao',
      subtitle: 'O ciclo original',
      author_name: ['Isaac Asimov'],
      language: ['eng'],
      first_publish_year: 1951,
      cover_i: 8765432,
      isbn: ['9780553293357', '0553293354'],
      publisher: ['Bantam'],
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
    expect(results[0].isbn10).toBe('0553293354')
    expect(results[0].isbn13).toBe('9780553293357')
    expect(results[0].subtitle).toBe('O ciclo original')
    expect(results[0].publisher).toBe('Bantam')
    expect(results[0].source).toBe('open-library')
    expect(results[0].language).toBe('eng')
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

  it('returns [] when Open Library rejects a short query with HTTP 422', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 422,
    } as Response)

    const results = await searchOpenLibrary('abc')
    expect(results).toEqual([])
  })
})

describe('searchOpenLibrary pagination', () => {
  it('forwards page to the URL when provided', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ docs: [] }),
    } as Response)

    await searchOpenLibrary('tolkien', 20, 2)

    const calledUrl = String(fetchSpy.mock.calls[0][0])
    expect(calledUrl).toMatch(/page=2/)
    expect(calledUrl).toMatch(/limit=20/)
  })

  it('uses Open Library ISBN search param for ISBN queries', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ docs: [] }),
    } as Response)

    await searchOpenLibrary('978-0-553-29335-7')

    const calledUrl = String(fetchSpy.mock.calls[0][0])
    expect(calledUrl).toContain('isbn=9780553293357')
    expect(calledUrl).not.toContain('q=')
  })

  it('defaults page to 1 when omitted', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ docs: [] }),
    } as Response)

    await searchOpenLibrary('tolkien')

    const calledUrl = String(fetchSpy.mock.calls[0][0])
    expect(calledUrl).toMatch(/page=1/)
  })

  it('backward compat: (query, limit) still works without page arg', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ docs: [] }),
    } as Response)

    await searchOpenLibrary('tolkien', 10)

    const calledUrl = String(fetchSpy.mock.calls[0][0])
    expect(calledUrl).toMatch(/limit=10/)
    expect(calledUrl).toMatch(/page=1/)
  })

  it('filters upstream results by the requested book language when provided', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        docs: [
          { title: 'Duna', author_name: ['Frank Herbert'], language: ['eng'] },
          { title: 'Fundação', author_name: ['Isaac Asimov'], language: ['por'] },
        ],
      }),
    } as Response)

    const results = await searchOpenLibrary('ficcao', 20, 1, 'en')

    expect(results).toHaveLength(1)
    expect(results[0].language).toBe('eng')
  })

  it('matches a requested language even when Open Library does not list it first', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        docs: [
          {
            title: "Harry Potter and the Philosopher's Stone",
            author_name: ['J.K. Rowling'],
            language: ['eng', 'spa', 'por'],
          },
        ],
      }),
    } as Response)

    const results = await searchOpenLibrary('harry potter pedra', 20, 1, 'pt-BR')

    expect(results).toHaveLength(1)
    expect(results[0].title).toBe("Harry Potter and the Philosopher's Stone")
    expect(results[0].language).toBe('por')
  })

  it('skips the upstream request entirely for queries shorter than three characters', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')

    const results = await searchOpenLibrary('cs')

    expect(results).toEqual([])
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
