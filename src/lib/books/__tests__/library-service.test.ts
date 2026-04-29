import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import {
  listBooks,
  getBook,
  SAFE_MATTER_OPTIONS,
  writeBook,
  updateBook,
  deleteBook,
} from '../library-service'
import { BookSchema } from '../schema'
import matter from 'gray-matter'
import { createStorageContext } from '@/lib/storage/context'

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
    // 3 valid books (valid-book.md, valid-book-chinese.md, book-no-added-at.md)
    // malformed and javascript-engine-attack are skipped
    // book-no-added-at.md exercises the lazy-backfill path (D-22)
    expect(books.length).toBe(3)
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
    expect(alquimista!.author).toEqual(['Paulo Coelho'])
    expect(alquimista!._notes).toContain('cafe')
    expect(alquimista!._notes).toContain('coracao')
  })

  it('parses UTF-8 Chinese content correctly', async () => {
    const books = await listBooks()
    const daodejing = books.find((b) => b.title === '道德经')
    expect(daodejing).toBeDefined()
    expect(daodejing!.author).toEqual(['老子'])
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
      'JavaScript front-matter engine is disabled for security reasons.',
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

describe('writeBook', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dona-flora-test-'))
    process.env.LIBRARY_DIR = tmpDir
  })

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true })
    delete process.env.LIBRARY_DIR
  })

  it('creates a .md file with frontmatter containing required fields', async () => {
    const result = await writeBook({
      title: 'Test Book',
      author: 'Test Author',
      status: 'quero-ler',
    })
    expect(result.slug).toBe('test-book')
    const content = await fs.readFile(path.join(tmpDir, 'test-book.md'), 'utf-8')
    const { data } = matter(content)
    expect(data.title).toBe('Test Book')
    expect(data.author).toBe('Test Author')
    expect(data.status).toBe('quero-ler')
    expect(data.added_at).toBeDefined()
  })

  it('puts notes text below the frontmatter delimiter', async () => {
    await writeBook({
      title: 'Notes Book',
      author: 'Author',
      status: 'lido',
      notes: 'My personal notes here.',
    })
    const content = await fs.readFile(path.join(tmpDir, 'notes-book.md'), 'utf-8')
    const { content: body } = matter(content)
    expect(body.trim()).toBe('My personal notes here.')
  })

  it('returns { slug } matching the generated filename', async () => {
    const result = await writeBook({
      title: 'O Alquimista',
      author: 'Paulo Coelho',
      status: 'lido',
    })
    expect(result.slug).toBe('o-alquimista')
    const exists = await fs
      .access(path.join(tmpDir, 'o-alquimista.md'))
      .then(() => true)
      .catch(() => false)
    expect(exists).toBe(true)
  })

  it('returns slug with -2 suffix when colliding title is added twice', async () => {
    await writeBook({ title: 'Collision', author: 'A', status: 'quero-ler' })
    const result2 = await writeBook({ title: 'Collision', author: 'B', status: 'quero-ler' })
    expect(result2.slug).toBe('collision-2')
    const exists = await fs
      .access(path.join(tmpDir, 'collision-2.md'))
      .then(() => true)
      .catch(() => false)
    expect(exists).toBe(true)
  })
})

describe('updateBook', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dona-flora-test-'))
    process.env.LIBRARY_DIR = tmpDir
  })

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true })
    delete process.env.LIBRARY_DIR
  })

  it('modifies only the specified field, preserving all others', async () => {
    const { slug } = await writeBook({
      title: 'Update Test',
      author: 'Original Author',
      status: 'quero-ler',
    })
    await updateBook(slug, { rating: 4 })
    const content = await fs.readFile(path.join(tmpDir, `${slug}.md`), 'utf-8')
    const { data } = matter(content)
    expect(data.rating).toBe(4)
    expect(data.title).toBe('Update Test')
    expect(data.author).toBe('Original Author')
    expect(data.status).toBe('quero-ler')
  })

  it('replaces notes body while preserving frontmatter', async () => {
    const { slug } = await writeBook({
      title: 'Notes Update',
      author: 'Author',
      status: 'lido',
      notes: 'Old notes.',
    })
    await updateBook(slug, { notes: 'New notes.' })
    const content = await fs.readFile(path.join(tmpDir, `${slug}.md`), 'utf-8')
    const { data, content: body } = matter(content)
    expect(body.trim()).toBe('New notes.')
    expect(data.title).toBe('Notes Update')
  })

  it('removes frontmatter keys when an update value is null', async () => {
    const { slug } = await writeBook({
      title: 'Clear Rating',
      author: 'Author',
      rating: 5,
      status: 'lido',
    })

    await updateBook(slug, { rating: null })

    const content = await fs.readFile(path.join(tmpDir, `${slug}.md`), 'utf-8')
    const { data } = matter(content)
    expect(data.rating).toBeUndefined()
    expect(data.title).toBe('Clear Rating')
  })
})

describe('deleteBook', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dona-flora-test-'))
    process.env.LIBRARY_DIR = tmpDir
  })

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true })
    delete process.env.LIBRARY_DIR
  })

  it('removes the .md file from disk', async () => {
    const { slug } = await writeBook({
      title: 'Delete Me',
      author: 'Author',
      status: 'quero-ler',
    })
    await deleteBook(slug)
    const exists = await fs
      .access(path.join(tmpDir, `${slug}.md`))
      .then(() => true)
      .catch(() => false)
    expect(exists).toBe(false)
  })

  it('throws an error when the book does not exist', async () => {
    await expect(deleteBook('nonexistent-slug')).rejects.toThrow()
  })
})

describe('library service with external Obsidian books directory', () => {
  let tmpDir: string
  let booksDir: string

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dona-flora-obsidian-'))
    booksDir = path.join(tmpDir, 'livros')
    await fs.mkdir(booksDir, { recursive: true })
  })

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  it('lists, reads, writes, updates, and deletes books through the configured external folder', async () => {
    const context = createStorageContext('user-1', path.join(tmpDir, 'app-data'), {
      booksDir,
    })

    const { slug } = await writeBook(
      {
        title: 'Livro Obsidian',
        author: 'Autora Local',
        status: 'quero-ler',
        notes: 'Notas no arquivo externo.',
      },
      context,
    )
    expect(slug).toBe('livro-obsidian')

    await expect(fs.readFile(path.join(booksDir, 'livro-obsidian.md'), 'utf-8')).resolves.toContain(
      'Notas no arquivo externo.',
    )

    const listed = await listBooks(context)
    expect(listed).toHaveLength(1)
    expect(listed[0].title).toBe('Livro Obsidian')

    const book = await getBook(slug, context)
    expect(book?.author).toEqual(['Autora Local'])

    await updateBook(slug, { rating: 5, notes: 'Nota atualizada.' }, context)
    const updated = await getBook(slug, context)
    expect(updated?.rating).toBe(5)
    expect(updated?._notes).toBe('Nota atualizada.')

    await deleteBook(slug, context)
    await expect(fs.access(path.join(booksDir, 'livro-obsidian.md'))).rejects.toThrow()
  })
})

describe('listBooks - added_at backfill (D-22)', () => {
  // Uses the shared FIXTURES_DIR set in the top-level beforeEach.
  // book-no-added-at.md has no added_at field, so the lazy-backfill
  // path from listBooks() must populate it from fs.stat().mtime.
  it('populates added_at from fs.stat().mtime when the field is absent', async () => {
    const books = await listBooks()
    const legacy = books.find((b) => b._filename === 'book-no-added-at.md')
    expect(legacy).toBeDefined()
    expect(legacy!.added_at).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('does not rewrite the .md file on disk after backfill', async () => {
    // Idempotency + Obsidian-safe: listBooks must never touch the .md file.
    const filepath = path.join(FIXTURES_DIR, 'book-no-added-at.md')
    const before = await fs.readFile(filepath, 'utf-8')
    await listBooks()
    const after = await fs.readFile(filepath, 'utf-8')
    expect(after).toBe(before)
  })
})
