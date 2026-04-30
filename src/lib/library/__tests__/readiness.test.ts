import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { buildLibraryReadinessReport } from '../readiness'
import { createStorageContext } from '@/lib/storage/context'

describe('buildLibraryReadinessReport', () => {
  it('reports readiness from valid Markdown books and tolerates invalid files', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dona-flora-readiness-'))
    const booksDir = path.join(tmpDir, 'livros')
    await fs.mkdir(booksDir, { recursive: true })
    await fs.writeFile(
      path.join(booksDir, 'livro-valido.md'),
      [
        '---',
        'title: Livro Valido',
        'author: Autora',
        'status: lido',
        'added_at: "2026-04-30"',
        '---',
        '',
        'Notas do livro valido.',
      ].join('\n'),
      'utf-8',
    )
    await fs.writeFile(
      path.join(booksDir, 'livro-invalido.md'),
      ['---', 'title: Livro Invalido', 'status: status-quebrado', '---'].join('\n'),
      'utf-8',
    )

    try {
      const context = createStorageContext('user-1', path.join(tmpDir, 'app'), {
        booksDir,
      })
      const report = await buildLibraryReadinessReport(context)

      expect(report.ok).toBe(true)
      expect(report.bookCount).toBe(1)
      expect(report.contextChars).toBeGreaterThan(0)
      expect(new Date(report.indexedAt).toString()).not.toBe('Invalid Date')
    } finally {
      warnSpy.mockRestore()
      await fs.rm(tmpDir, { recursive: true, force: true })
    }
  })
})
