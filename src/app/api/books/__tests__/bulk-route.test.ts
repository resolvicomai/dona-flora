import { NextRequest } from 'next/server'

jest.mock('@/lib/auth/server', () => ({
  getSessionStorageContext: jest.fn(() => ({
    booksDir: '/tmp/books',
    chatsDir: '/tmp/chats',
    dataRoot: '/tmp',
    trailsDir: '/tmp/trails',
    userId: 'user-1',
    userRoot: '/tmp/users/user-1',
  })),
  requireVerifiedRequestSession: jest.fn(async () => ({
    ok: true,
    session: {
      session: {
        expiresAt: new Date('2026-04-29T00:00:00Z'),
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
    },
  })),
}))

jest.mock('@/lib/books/library-service', () => ({
  getBook: jest.fn(async () => ({
    _filename: 'livro-um.md',
    _notes: '',
    added_at: '2026-04-29',
    author: ['Autora'],
    status: 'quero-ler',
    tags: ['existente'],
    title: 'Livro Um',
  })),
  updateBook: jest.fn(async () => undefined),
}))

import { PATCH } from '@/app/api/books/bulk/route'
import { getBook, updateBook } from '@/lib/books/library-service'

const mockedGetBook = getBook as jest.MockedFunction<typeof getBook>
const mockedUpdateBook = updateBook as jest.MockedFunction<typeof updateBook>

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/books/bulk', {
    body: JSON.stringify(body),
    method: 'PATCH',
  })
}

beforeEach(() => {
  mockedGetBook.mockClear()
  mockedUpdateBook.mockClear()
  mockedGetBook.mockResolvedValue({
    _filename: 'livro-um.md',
    _notes: '',
    added_at: '2026-04-29',
    author: ['Autora'],
    status: 'quero-ler',
    tags: ['existente'],
    title: 'Livro Um',
  })
})

describe('PATCH /api/books/bulk', () => {
  it('rejects path traversal slugs', async () => {
    const response = await PATCH(
      makeRequest({
        slugs: ['../../segredo'],
        updates: { status: 'lido' },
      }),
    )

    expect(response.status).toBe(400)
    expect(mockedUpdateBook).not.toHaveBeenCalled()
  })

  it('updates selected books and merges added tags', async () => {
    const response = await PATCH(
      makeRequest({
        slugs: ['livro-um'],
        updates: {
          rating: null,
          status: 'lido',
          tagMode: 'add',
          tags: ['Filosofia'],
        },
      }),
    )

    expect(response.status).toBe(200)
    expect(mockedUpdateBook).toHaveBeenCalledWith(
      'livro-um',
      {
        rating: null,
        status: 'lido',
        tags: ['existente', 'filosofia'],
      },
      expect.objectContaining({ userId: 'user-1' }),
    )
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      updatedCount: 1,
    })
  })

  it('can clear tags through replace mode with an empty list', async () => {
    const response = await PATCH(
      makeRequest({
        slugs: ['livro-um'],
        updates: {
          tagMode: 'replace',
          tags: [],
        },
      }),
    )

    expect(response.status).toBe(200)
    expect(mockedUpdateBook).toHaveBeenCalledWith(
      'livro-um',
      { tags: null },
      expect.objectContaining({ userId: 'user-1' }),
    )
  })
})
