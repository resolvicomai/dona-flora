import path from 'path'
import { loadLibraryContext } from '../context'

const FIXTURES_DIR = path.join(__dirname, 'fixtures/books')

let warnSpy: jest.SpyInstance

beforeEach(() => {
  process.env.LIBRARY_DIR = FIXTURES_DIR
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  delete process.env.LIBRARY_DIR
  warnSpy.mockRestore()
})

describe('loadLibraryContext', () => {
  it('returns empty string when directory is missing', async () => {
    process.env.LIBRARY_DIR = path.join(__dirname, 'nonexistent-dir')
    const result = await loadLibraryContext()
    expect(result).toBe('')
  })

  it('returns concatenated entries separated by blank lines', async () => {
    const result = await loadLibraryContext()
    // Two valid entries (a-livro-cheio + b-livro-minimal), joined by \n\n
    const sections = result.split('\n\n')
    expect(sections.length).toBe(2)
  })

  it('includes rating line only when rating is set', async () => {
    const result = await loadLibraryContext()
    // a-livro-cheio has rating=5
    expect(result).toContain('rating: 5/5')
    // b-livro-minimal has no rating — count of rating lines MUST be exactly 1
    const matches = result.match(/^rating:/gm) ?? []
    expect(matches.length).toBe(1)
  })

  it('includes genre line only when genre is non-empty', async () => {
    const result = await loadLibraryContext()
    expect(result).toContain('genre: Literatura brasileira')
    const matches = result.match(/^genre:/gm) ?? []
    expect(matches.length).toBe(1)
  })

  it('includes notes line only when body is non-empty', async () => {
    const result = await loadLibraryContext()
    // The minimal book has empty body → its section MUST NOT contain notes:
    const sections = result.split('\n\n')
    const minimalSection = sections.find((s) => s.includes('slug: b-livro-minimal'))
    expect(minimalSection).toBeDefined()
    expect(minimalSection!).not.toContain('notes:')
    // The full book MUST have notes:
    const fullSection = sections.find((s) => s.includes('slug: a-livro-cheio'))
    expect(fullSection).toBeDefined()
    expect(fullSection!).toContain('notes:')
  })

  it('truncates notes body to 400 chars', async () => {
    // Temporarily add a long-notes fixture directory
    const longDir = path.join(__dirname, 'fixtures/long-notes')
    const fs = await import('fs/promises')
    await fs.mkdir(longDir, { recursive: true })
    const longBody = 'x'.repeat(600)
    const filepath = path.join(longDir, 'livro-longo.md')
    await fs.writeFile(
      filepath,
      `---\ntitle: Livro Longo\nauthor: Autor\nstatus: lido\nadded_at: "2026-01-01"\n---\n\n${longBody}\n`,
      'utf-8'
    )
    try {
      process.env.LIBRARY_DIR = longDir
      const result = await loadLibraryContext()
      // The notes: line should contain exactly 400 x's (never 600)
      const notesLine = result.split('\n').find((l) => l.startsWith('notes:'))
      expect(notesLine).toBeDefined()
      const notesBody = notesLine!.replace(/^notes:\s*/, '')
      expect(notesBody.length).toBe(400)
      expect(notesBody).toBe('x'.repeat(400))
    } finally {
      await fs.rm(longDir, { recursive: true, force: true })
    }
  })

  it('entries are lexically sorted for prompt cache stability', async () => {
    const result = await loadLibraryContext()
    const idxA = result.indexOf('slug: a-livro-cheio')
    const idxB = result.indexOf('slug: b-livro-minimal')
    expect(idxA).toBeGreaterThanOrEqual(0)
    expect(idxB).toBeGreaterThanOrEqual(0)
    expect(idxA).toBeLessThan(idxB)
  })

  it('skips malformed file and emits console.warn', async () => {
    const result = await loadLibraryContext()
    // malformed file must not show up in output
    expect(result).not.toContain('z-malformado')
    // warning must have been emitted
    expect(warnSpy).toHaveBeenCalled()
    const warnCalls = warnSpy.mock.calls.map((args) => args.join(' '))
    const hasParseWarn = warnCalls.some((msg) =>
      msg.includes('[LibraryContext]') && msg.toLowerCase().includes('z-malformado')
    )
    expect(hasParseWarn).toBe(true)
  })

  it('renders the canonical heading with title and author', async () => {
    const result = await loadLibraryContext()
    expect(result).toContain('### Grande Sertão: Veredas — João Guimarães Rosa')
    expect(result).toContain('### Livro Mínimo — Autor Desconhecido')
  })

  it('renders status line', async () => {
    const result = await loadLibraryContext()
    expect(result).toContain('status: lido')
    expect(result).toContain('status: quero-ler')
  })
})
