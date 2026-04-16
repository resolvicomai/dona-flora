import path from 'path'
import { listBooks, getBook, SAFE_MATTER_OPTIONS } from '../library-service'
import { BookSchema } from '../schema'
import matter from 'gray-matter'

const FIXTURES_DIR = path.join(__dirname, 'fixtures')

// Override LIBRARY_DIR to point to test fixtures
beforeEach(() => {
  process.env.LIBRARY_DIR = FIXTURES_DIR
})

afterEach(() => {
  delete process.env.LIBRARY_DIR
})

describe('listBooks', () => {
  it('returns valid books from the fixtures directory', async () => {
    const books = await listBooks()
    // 2 valid books (valid-book.md, valid-book-chinese.md)
    // malformed and javascript-engine-attack are skipped
    expect(books.length).toBe(2)
  })

  it('returns empty array when directory does not exist', async () => {
    process.env.LIBRARY_DIR = '/nonexistent/path'
    const books = await listBooks()
    expect(books).toEqual([])
  })

  it('skips files with malformed frontmatter without throwing', async () => {
    // malformed-frontmatter.md is missing author and status
    const books = await listBooks()
    const titles = books.map((b) => b.title)
    expect(titles).not.toContain('No Author')
  })

  it('parses UTF-8 Portuguese content correctly', async () => {
    const books = await listBooks()
    const alquimista = books.find((b) => b.title === 'O Alquimista')
    expect(alquimista).toBeDefined()
    expect(alquimista!.author).toBe('Paulo Coelho')
    expect(alquimista!._notes).toContain('cafe')
    expect(alquimista!._notes).toContain('coracao')
  })

  it('parses UTF-8 Chinese content correctly', async () => {
    const books = await listBooks()
    const daodejing = books.find((b) => b.title === '道德经')
    expect(daodejing).toBeDefined()
    expect(daodejing!.author).toBe('老子')
    expect(daodejing!._notes).toContain('道可道')
  })
})

describe('getBook', () => {
  it('returns a valid book by filename slug', async () => {
    const book = await getBook('valid-book')
    expect(book).not.toBeNull()
    expect(book!.title).toBe('O Alquimista')
    expect(book!.status).toBe('quero-ler')
  })

  it('returns null for non-existent book', async () => {
    const book = await getBook('does-not-exist')
    expect(book).toBeNull()
  })

  it('returns null for malformed book', async () => {
    const book = await getBook('malformed-frontmatter')
    expect(book).toBeNull()
  })
})

describe('SAFE_MATTER_OPTIONS (CVE-2025-65108)', () => {
  it('throws when parsing JavaScript-engine frontmatter', () => {
    const jsContent = '---javascript\nreturn { title: "Attack" }\n---\n'
    expect(() => matter(jsContent, SAFE_MATTER_OPTIONS)).toThrow(
      'JavaScript front-matter engine is disabled for security reasons.'
    )
  })
})

describe('BookSchema', () => {
  it('validates a complete book object', () => {
    const result = BookSchema.safeParse({
      title: 'Test Book',
      author: 'Test Author',
      status: 'lido',
      rating: 4,
      added_at: '2026-01-01',
      _notes: 'Some notes',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const result = BookSchema.safeParse({
      title: 'Test Book',
      // missing author and status
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid status enum', () => {
    const result = BookSchema.safeParse({
      title: 'Test',
      author: 'Author',
      status: 'invalid-status',
      added_at: '2026-01-01',
    })
    expect(result.success).toBe(false)
  })

  it('rejects rating outside 1-5 range', () => {
    const result = BookSchema.safeParse({
      title: 'Test',
      author: 'Author',
      status: 'lido',
      added_at: '2026-01-01',
      rating: 6,
    })
    expect(result.success).toBe(false)
  })
})
