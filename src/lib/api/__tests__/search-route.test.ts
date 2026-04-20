import { NextRequest } from 'next/server'

jest.mock('@/lib/auth/server', () => ({
  getRequestSession: jest.fn(async () => ({
    session: {
      expiresAt: new Date('2026-04-20T00:00:00Z'),
      id: 'session-1',
      token: 'token-1',
      userId: 'user-1',
    },
    user: {
      email: 'owner@example.com',
      emailVerified: true,
      id: 'user-1',
      name: 'Owner',
      role: 'owner',
    },
  })),
}))

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

function makeRequestBody(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/books/search', {
    method: 'POST',
    body: JSON.stringify(body),
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
      { title: 'Dom Casmurro', authors: ['Machado de Assis'], language: 'pt-BR' },
    ]
    mockedSearchGoogleBooks.mockResolvedValueOnce(googleResults)
    mockedSearchOpenLibrary.mockResolvedValueOnce([])

    const res = await POST(makeRequest('dom casmurro'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].title).toBe('Dom Casmurro')
    expect(body[0].language).toBe('pt-BR')
    expect(mockedSearchOpenLibrary).not.toHaveBeenCalled()
  })

  it('falls back to Open Library when Google returns empty', async () => {
    mockedSearchGoogleBooks.mockResolvedValueOnce([])
    mockedSearchOpenLibrary.mockResolvedValueOnce([
      { title: 'Rare Book', authors: ['Unknown'], language: 'en' },
    ])

    const res = await POST(makeRequest('rare query'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].title).toBe('Rare Book')
    expect(body[0].language).toBe('en')
    expect(mockedSearchOpenLibrary).toHaveBeenCalledTimes(1)
  })

  it('falls back to Open Library when Google throws (503/429/missing key)', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    mockedSearchGoogleBooks.mockRejectedValueOnce(
      new Error('[GoogleBooks] API error: 503')
    )
    mockedSearchOpenLibrary.mockResolvedValueOnce([
      { title: 'Dom Casmurro (OL)', authors: ['Machado'], language: 'pt-BR' },
    ])

    const res = await POST(makeRequest('dom casmurro'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].title).toBe('Dom Casmurro (OL)')
    expect(body[0].language).toBe('pt-BR')
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

describe('POST /api/books/search — pagination', () => {
  it('threads startIndex to searchGoogleBooks when provided', async () => {
    mockedSearchGoogleBooks.mockResolvedValueOnce([
      { title: 'Tolkien', authors: ['JRRT'], language: 'en' },
    ])

    const res = await POST(
      makeRequestBody({ query: 'tolkien', startIndex: 20 }),
    )

    expect(res.status).toBe(200)
    expect(mockedSearchGoogleBooks).toHaveBeenCalledWith(
      'tolkien',
      expect.any(Number),
      20,
    )
  })

  it('threads page to searchOpenLibrary on fallback when provided', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    mockedSearchGoogleBooks.mockResolvedValueOnce([])
    mockedSearchOpenLibrary.mockResolvedValueOnce([
      { title: 'Tolkien OL', authors: ['JRRT'] },
    ])

    const res = await POST(
      makeRequestBody({ query: 'tolkien', page: 3 }),
    )

    expect(res.status).toBe(200)
    expect(mockedSearchOpenLibrary).toHaveBeenCalledWith(
      'tolkien',
      expect.any(Number),
      3,
    )
    warnSpy.mockRestore()
  })

  it('defaults startIndex=0 and page=1 when omitted', async () => {
    mockedSearchGoogleBooks.mockResolvedValueOnce([
      { title: 'Tolkien', authors: ['JRRT'] },
    ])

    const res = await POST(makeRequestBody({ query: 'tolkien' }))

    expect(res.status).toBe(200)
    expect(mockedSearchGoogleBooks).toHaveBeenCalledWith(
      'tolkien',
      expect.any(Number),
      0,
    )
  })

  it('returns 400 when startIndex is negative', async () => {
    const res = await POST(
      makeRequestBody({ query: 'tolkien', startIndex: -1 }),
    )

    expect(res.status).toBe(400)
    expect(mockedSearchGoogleBooks).not.toHaveBeenCalled()
    expect(mockedSearchOpenLibrary).not.toHaveBeenCalled()
  })

  it('returns 400 when page is 0', async () => {
    const res = await POST(makeRequestBody({ query: 'tolkien', page: 0 }))

    expect(res.status).toBe(400)
    expect(mockedSearchGoogleBooks).not.toHaveBeenCalled()
    expect(mockedSearchOpenLibrary).not.toHaveBeenCalled()
  })
})
