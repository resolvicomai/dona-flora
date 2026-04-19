import { NextRequest } from 'next/server'

jest.mock('@/lib/trails/store', () => ({
  saveTrail: jest.fn(),
}))

// WR-06: trails route cross-checks book_refs against the known-slugs set.
// Default mock returns a permissive set that contains every fixture slug
// used in the happy-path tests; individual tests override as needed.
jest.mock('@/lib/library/slug-set', () => ({
  loadKnownSlugs: jest.fn(
    async () => new Set(['o-hobbit', 'a-sociedade-do-anel']),
  ),
}))

import { POST } from '@/app/api/trails/route'
import { saveTrail } from '@/lib/trails/store'
import { loadKnownSlugs } from '@/lib/library/slug-set'

const mockedSaveTrail = saveTrail as jest.MockedFunction<typeof saveTrail>
const mockedLoadKnownSlugs = loadKnownSlugs as jest.MockedFunction<
  typeof loadKnownSlugs
>

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/trails', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

beforeEach(() => {
  mockedSaveTrail.mockReset()
  mockedLoadKnownSlugs.mockReset()
  mockedLoadKnownSlugs.mockResolvedValue(
    new Set(['o-hobbit', 'a-sociedade-do-anel']),
  )
})

describe('POST /api/trails — happy path', () => {
  it('returns 201 and slug on valid body', async () => {
    mockedSaveTrail.mockResolvedValueOnce({ slug: 'minha-trilha' })
    const res = await POST(
      makeRequest({
        title: 'Minha Trilha',
        book_refs: ['o-hobbit', 'a-sociedade-do-anel'],
      })
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.slug).toBe('minha-trilha')
    expect(mockedSaveTrail).toHaveBeenCalledWith({
      title: 'Minha Trilha',
      book_refs: ['o-hobbit', 'a-sociedade-do-anel'],
    })
  })

  it('forwards optional goal and notes', async () => {
    mockedSaveTrail.mockResolvedValueOnce({ slug: 'trilha-x' })
    const res = await POST(
      makeRequest({
        title: 'Trilha X',
        goal: 'Ler fantasia clássica',
        book_refs: ['o-hobbit'],
        notes: 'Três livros, um por mês',
      })
    )
    expect(res.status).toBe(201)
    expect(mockedSaveTrail).toHaveBeenCalledWith({
      title: 'Trilha X',
      goal: 'Ler fantasia clássica',
      book_refs: ['o-hobbit'],
      notes: 'Três livros, um por mês',
    })
  })
})

describe('POST /api/trails — validation', () => {
  it('returns 400 when title is empty', async () => {
    const res = await POST(
      makeRequest({ title: '', book_refs: ['o-hobbit'] })
    )
    expect(res.status).toBe(400)
    expect(mockedSaveTrail).not.toHaveBeenCalled()
  })

  it('returns 400 when book_refs is empty', async () => {
    const res = await POST(
      makeRequest({ title: 'Minha Trilha', book_refs: [] })
    )
    expect(res.status).toBe(400)
    expect(mockedSaveTrail).not.toHaveBeenCalled()
  })

  it('returns 400 when a book_ref is not kebab-case', async () => {
    const res = await POST(
      makeRequest({
        title: 'Minha Trilha',
        book_refs: ['O Hobbit'],
      })
    )
    expect(res.status).toBe(400)
    expect(mockedSaveTrail).not.toHaveBeenCalled()
  })

  it("returns 400 when a book_ref contains path-traversal chars ('../etc')", async () => {
    const res = await POST(
      makeRequest({
        title: 'Minha Trilha',
        book_refs: ['../etc/passwd'],
      })
    )
    expect(res.status).toBe(400)
    expect(mockedSaveTrail).not.toHaveBeenCalled()
  })

  // WR-06: kebab-valid but non-existent slugs are rejected so we don't
  // persist a dangling reference.
  it('returns 400 when a kebab-valid book_ref is not in loadKnownSlugs', async () => {
    mockedLoadKnownSlugs.mockResolvedValueOnce(new Set(['o-hobbit']))
    const res = await POST(
      makeRequest({
        title: 'Minha Trilha',
        book_refs: ['o-hobbit', 'livro-que-nao-existe'],
      })
    )
    expect(res.status).toBe(400)
    expect(mockedSaveTrail).not.toHaveBeenCalled()
    const body = await res.json()
    expect(body.details?.fieldErrors?.book_refs?.[0]).toMatch(
      /livro-que-nao-existe/,
    )
  })

  it('returns 400 when body is not JSON', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const res = await POST(makeRequest('not-json{{{'))
    expect(res.status).toBe(400)
    expect(mockedSaveTrail).not.toHaveBeenCalled()
  })
})

describe('POST /api/trails — failure paths', () => {
  it('returns 500 when saveTrail throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    mockedSaveTrail.mockRejectedValueOnce(new Error('disk full'))
    const res = await POST(
      makeRequest({ title: 'Minha Trilha', book_refs: ['o-hobbit'] })
    )
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/Erro ao salvar trilha/i)
  })
})
