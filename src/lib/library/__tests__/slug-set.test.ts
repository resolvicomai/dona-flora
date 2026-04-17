import path from 'path'
import { loadKnownSlugs } from '../slug-set'

const FIXTURES_DIR = path.join(__dirname, 'fixtures/slug-set')

beforeEach(() => {
  process.env.LIBRARY_DIR = FIXTURES_DIR
})

afterEach(() => {
  delete process.env.LIBRARY_DIR
})

describe('loadKnownSlugs', () => {
  it('returns a Set containing every .md basename without extension', async () => {
    const slugs = await loadKnownSlugs()
    expect(slugs).toBeInstanceOf(Set)
    expect(slugs.has('foo')).toBe(true)
    expect(slugs.has('bar')).toBe(true)
  })

  it('ignores non-md files', async () => {
    const slugs = await loadKnownSlugs()
    expect(slugs.has('not-a-book')).toBe(false)
    expect(slugs.has('not-a-book.txt')).toBe(false)
    expect(slugs.size).toBe(2)
  })

  it('returns empty Set when directory is missing', async () => {
    process.env.LIBRARY_DIR = path.join(__dirname, 'nonexistent-dir')
    const slugs = await loadKnownSlugs()
    expect(slugs).toBeInstanceOf(Set)
    expect(slugs.size).toBe(0)
  })
})
