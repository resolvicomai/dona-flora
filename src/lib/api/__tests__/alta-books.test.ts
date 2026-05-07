import { searchAltaBooks } from '../alta-books'

const MOCK_STORE_RESPONSE = [
  {
    id: 62888,
    name: 'Máquinas Éticas',
    sku: '978-85-508-2240-2',
    short_description:
      '<h4><span title="seu guia conciso para uma IA totalmente imparcial, transparente e respeitosa">seu guia conciso para uma IA totalmente imparcial, transparente e respeitosa</span></h4><h4>Autor(es): Reid Blackman</h4><p>Um guia prático sobre riscos éticos em IA.</p>',
    images: [
      {
        src: 'https://altabooks.com.br/wp-content/uploads/2024/03/CAPA_1000px_MaquinasEticas.webp',
      },
    ],
  },
]

const emptyStoreResponse = {
  ok: true,
  json: async () => [],
} as Response

beforeEach(() => jest.restoreAllMocks())

describe('searchAltaBooks', () => {
  it('parses Alta Books store results into BookSearchResult[]', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(emptyStoreResponse)
      .mockResolvedValueOnce(emptyStoreResponse)
      .mockResolvedValueOnce(emptyStoreResponse)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_STORE_RESPONSE,
      } as Response)

    const results = await searchAltaBooks('máquinas éticas reid blackman')

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      title: 'Máquinas Éticas',
      authors: ['Reid Blackman'],
      isbn: '9788550822402',
      isbn13: '9788550822402',
      publisher: 'Alta Books',
      source: 'alta-books',
      language: 'pt-BR',
      cover: 'https://altabooks.com.br/wp-content/uploads/2024/03/CAPA_1000px_MaquinasEticas.webp',
      coverSource: 'alta-books',
      synopsisSource: 'Alta Books',
    })
    expect(results[0].subtitle).toBe(
      'seu guia conciso para uma IA totalmente imparcial, transparente e respeitosa',
    )
    expect(results[0].synopsis).toContain('Um guia prático')
  })

  it('searches hyphenated ISBN when the user types digits only', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(emptyStoreResponse)
      .mockResolvedValueOnce(emptyStoreResponse)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_STORE_RESPONSE,
      } as Response)

    const results = await searchAltaBooks('9788550822402')

    expect(results).toHaveLength(1)
    expect(String(fetchSpy.mock.calls[0][0])).toContain('search=9788550822402')
    expect(String(fetchSpy.mock.calls[1][0])).toContain('search=978-85-508-2240-2')
  })

  it('tries the likely title core when the user includes author names', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(emptyStoreResponse)
      .mockResolvedValueOnce(emptyStoreResponse)
      .mockResolvedValueOnce(emptyStoreResponse)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_STORE_RESPONSE,
      } as Response)

    const results = await searchAltaBooks('máquinas éticas reid blackman')

    expect(results).toHaveLength(1)
    expect(String(fetchSpy.mock.calls[2][0])).toContain('search=m%C3%A1quinas+%C3%A9ticas')
  })

  it('does not query Alta Books for non-Portuguese language filters', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')

    const results = await searchAltaBooks('maquinas eticas', 5, 'en')

    expect(results).toEqual([])
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
