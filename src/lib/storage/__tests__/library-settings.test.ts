import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { validateBooksDirectory } from '@/lib/storage/library-settings'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dona-flora-library-settings-'))
})

afterEach(async () => {
  if (tmpDir) {
    await fs.chmod(tmpDir, 0o700).catch(() => undefined)
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
})

describe('validateBooksDirectory', () => {
  it('accepts an existing absolute directory and counts Markdown files', async () => {
    await fs.writeFile(path.join(tmpDir, 'dom-casmurro.md'), '# notas')
    await fs.writeFile(path.join(tmpDir, 'cover.txt'), 'ignore')

    const result = await validateBooksDirectory(tmpDir)

    expect(result.booksDir).toBe(tmpDir)
    expect(result.mdFileCount).toBe(1)
  })

  it('rejects relative paths', async () => {
    await expect(validateBooksDirectory('livros')).rejects.toThrow('caminho absoluto')
  })

  it('rejects missing directories', async () => {
    await expect(validateBooksDirectory(path.join(tmpDir, 'nao-existe'))).rejects.toThrow(
      'Pasta não encontrada',
    )
  })

  it('rejects files instead of directories', async () => {
    const filePath = path.join(tmpDir, 'book.md')
    await fs.writeFile(filePath, '# livro')

    await expect(validateBooksDirectory(filePath)).rejects.toThrow('precisa apontar para uma pasta')
  })

  it('rejects directories without read/write permission', async () => {
    await fs.chmod(tmpDir, 0o000)

    await expect(validateBooksDirectory(tmpDir)).rejects.toThrow('permitir leitura e escrita')
  })
})
