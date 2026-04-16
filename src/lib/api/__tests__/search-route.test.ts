import { NextRequest } from 'next/server'
import { POST } from '@/app/api/books/search/route'
import { searchGoogleBooks } from '@/lib/api/google-books'
import { searchOpenLibrary } from '@/lib/api/open-library'
import type { BookSearchResult } from '@/lib/api/google-books'

jest.mock('@/lib/api/google-books')
jest.mock('@/lib/api/open-library')

const mockedSearchGoogleBooks = searchGoogleBooks as jest.MockedFunction<
  typeof searchGoogleBooks
>
const mockedSearchOpenLibrary = searchOpenLibrary as jest.MockedFunction<
  typeof searchOpenLibrary
>

function makeRequest(query: unknown): NextRequest {
  return new NextRequest('http://localhost/api/books/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  })
}

beforeEach(() => {
  jest.restoreAllMocks()
  mockedSearchGoogleBooks.mockReset()
  mockedSearchOpenLibrary.mockReset()
})

describe('POST /api/books/search — resilient fallback', () => {
  it('returns Google results when Google Books succeeds', async () => {
    const googleResults: BookSearchResult[] = [
      { title: 'Dom Casmurro', authors: ['Machado de Assis'] },
    ]
    mockedSearchGoogleBooks.mockResolvedValueOnce(googleResults)
    mockedSearchOpenLibrary.mockResolvedValueOnce([])

    const res = await POST(makeRequest('dom casmurro'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].title).toBe('Dom Casmurro')
    expect(mockedSearchOpenLibrary).not.toHaveBeenCalled()
  })

  it('falls back to Open Library when Google returns empty', async () => {
    mockedSearchGoogleBooks.mockResolvedValueOnce([])
    mockedSearchOpenLibrary.mockResolvedValueOnce([
      { title: 'Rare Book', authors: ['Unknown'] },
    ])

    const res = await POST(makeRequest('rare query'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].title).toBe('Rare Book')
    expect(mockedSearchOpenLibrary).toHaveBeenCalledTimes(1)
  })

  it('falls back to Open Library when Google throws (503/429/missing key)', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    mockedSearchGoogleBooks.mockRejectedValueOnce(
      new Error('[GoogleBooks] API error: 503')
    )
    mockedSearchOpenLibrary.mockResolvedValueOnce([
      { title: 'Dom Casmurro (OL)', authors: ['Machado'] },
    ])

    const res = await POST(makeRequest('dom casmurro'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].title).toBe('Dom Casmurro (OL)')
    expect(mockedSearchOpenLibrary).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalled()
  })

  it('returns 500 only when BOTH providers throw', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    mockedSearchGoogleBooks.mockRejectedValueOnce(new Error('Google down'))
    mockedSearchOpenLibrary.mockRejectedValueOnce(
      new Error('Open Library down')
    )

    const res = await POST(makeRequest('any query'))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toMatch(/Erro ao buscar livros/i)
  })

  it('returns 400 on invalid input (query too short)', async () => {
    const res = await POST(makeRequest('a'))

    expect(res.status).toBe(400)
    expect(mockedSearchGoogleBooks).not.toHaveBeenCalled()
    expect(mockedSearchOpenLibrary).not.toHaveBeenCalled()
  })
})
