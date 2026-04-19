import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import matter from 'gray-matter'
import { SAFE_MATTER_OPTIONS } from '@/lib/books/library-service'
import { saveTrail } from '../store'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dona-flora-trails-'))
  process.env.TRAILS_DIR = tmpDir
})

afterEach(async () => {
  delete process.env.TRAILS_DIR
  if (tmpDir) {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
})

describe('saveTrail', () => {
  it('writes file at data/trails/{slug}.md with expected frontmatter', async () => {
    const result = await saveTrail({
      title: 'Minha Trilha Fantastica',
      goal: 'Entender alta fantasia',
      book_refs: ['o-hobbit', 'a-sociedade-do-anel'],
      notes: 'Começar com o mais leve.',
    })

    expect(result.slug).toBe('minha-trilha-fantastica')

    const filepath = path.join(tmpDir, `${result.slug}.md`)
    const raw = await fs.readFile(filepath, 'utf-8')
    const { data, content } = matter(raw, SAFE_MATTER_OPTIONS)

    expect(data.title).toBe('Minha Trilha Fantastica')
    expect(data.goal).toBe('Entender alta fantasia')
    expect(data.book_refs).toEqual(['o-hobbit', 'a-sociedade-do-anel'])
    expect(data.notes).toBe('Começar com o mais leve.')
    expect(typeof data.created_at).toBe('string')
    // created_at is an ISO string
    expect(data.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    // Body contains the notes
    expect(content.trim()).toBe('Começar com o mais leve.')
  })

  it('preserves book_refs order', async () => {
    const { slug } = await saveTrail({
      title: 'Ordem Importa',
      book_refs: ['third', 'first', 'second'],
    })
    const raw = await fs.readFile(path.join(tmpDir, `${slug}.md`), 'utf-8')
    const { data } = matter(raw, SAFE_MATTER_OPTIONS)
    expect(data.book_refs).toEqual(['third', 'first', 'second'])
  })

  it('returns slug matching the file created on disk', async () => {
    const { slug } = await saveTrail({
      title: 'Título Qualquer',
      book_refs: ['a'],
    })
    const exists = await fs
      .access(path.join(tmpDir, `${slug}.md`))
      .then(() => true)
      .catch(() => false)
    expect(exists).toBe(true)
  })

  it('resolves collision with -2 suffix when slug already exists', async () => {
    // Pre-create a file with the exact base slug
    await fs.writeFile(
      path.join(tmpDir, 'minha-trilha.md'),
      '---\ntitle: Existing\ngoal: ""\ncreated_at: "2026-04-17T10:00:00Z"\nbook_refs:\n  - x\nnotes: ""\n---\n\n'
    )

    const { slug } = await saveTrail({
      title: 'Minha Trilha',
      book_refs: ['novo'],
    })
    expect(slug).toBe('minha-trilha-2')
    const existsNew = await fs
      .access(path.join(tmpDir, 'minha-trilha-2.md'))
      .then(() => true)
      .catch(() => false)
    expect(existsNew).toBe(true)
  })

  it('chains collisions -2 -3 when -2 also exists', async () => {
    await fs.writeFile(path.join(tmpDir, 'minha-trilha.md'), '---\ntitle: a\n---\n\n')
    await fs.writeFile(path.join(tmpDir, 'minha-trilha-2.md'), '---\ntitle: b\n---\n\n')

    const { slug } = await saveTrail({
      title: 'Minha Trilha',
      book_refs: ['ref-only'],
    })
    expect(slug).toBe('minha-trilha-3')
  })

  it('throws when book_refs is empty (Zod min(1))', async () => {
    await expect(
      saveTrail({ title: 'Sem Livros', book_refs: [] })
    ).rejects.toThrow()
  })

  // WR-09: punctuation-only titles are rejected by the schema (they
  // slugify to empty and would collide on the literal `trilha.md`
  // fallback). The store throws; the API boundary returns 400. Previous
  // tests covered the old fallback behavior — replaced with explicit
  // rejection.
  it('throws when title has no slug-eligible characters (WR-09)', async () => {
    await expect(
      saveTrail({ title: '!!!', book_refs: ['foo'] }),
    ).rejects.toThrow()
  })

  it('throws on punctuation-only title even with "???" variant (WR-09)', async () => {
    await expect(
      saveTrail({ title: '???', book_refs: ['bar'] }),
    ).rejects.toThrow()
  })

  it('omits empty goal/notes gracefully when not provided', async () => {
    const { slug } = await saveTrail({
      title: 'Só Título',
      book_refs: ['a'],
    })
    const raw = await fs.readFile(path.join(tmpDir, `${slug}.md`), 'utf-8')
    const { data } = matter(raw, SAFE_MATTER_OPTIONS)
    expect(data.goal).toBe('')
    expect(data.notes).toBe('')
  })
})
