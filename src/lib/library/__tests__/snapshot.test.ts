import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { createStorageContext } from '@/lib/storage/context'
import { loadLibrarySnapshot } from '../snapshot'

describe('loadLibrarySnapshot', () => {
  let tmpDir: string
  let booksDir: string

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dona-flora-acervo-'))
    booksDir = path.join(tmpDir, 'livros')
    await fs.mkdir(booksDir, { recursive: true })
  })

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  it('retorna livros validos e diagnosticos para Markdown invalido', async () => {
    await fs.writeFile(
      path.join(booksDir, 'livro-valido.md'),
      [
        '---',
        'title: Livro Valido',
        'author: Autora',
        'status: lendo',
        'added_at: "2026-04-30"',
        '---',
        '',
        'Notas do livro.',
      ].join('\n'),
      'utf-8',
    )
    await fs.writeFile(
      path.join(booksDir, 'livro-invalido.md'),
      ['---', 'title: Livro Invalido', '---', '', 'Sem autor nem status.'].join('\n'),
      'utf-8',
    )

    const context = createStorageContext('user-1', path.join(tmpDir, 'app'), { booksDir })
    const snapshot = await loadLibrarySnapshot(context)

    expect(snapshot.books).toHaveLength(1)
    expect(snapshot.books[0]).toMatchObject({
      _filename: 'livro-valido.md',
      _notes: 'Notas do livro.',
      author: ['Autora'],
      title: 'Livro Valido',
    })
    expect(snapshot.diagnostics).toEqual([
      expect.objectContaining({
        filename: 'livro-invalido.md',
        kind: 'invalid-frontmatter',
      }),
    ])
  })

  it('retorna diagnostico quando a pasta do acervo nao existe', async () => {
    const context = createStorageContext('user-1', path.join(tmpDir, 'app'), {
      booksDir: path.join(tmpDir, 'pasta-ausente'),
    })

    const snapshot = await loadLibrarySnapshot(context)

    expect(snapshot.books).toEqual([])
    expect(snapshot.diagnostics).toEqual([
      expect.objectContaining({
        filepath: path.join(tmpDir, 'pasta-ausente'),
        kind: 'directory-missing',
      }),
    ])
  })

  it('atualiza a proxima leitura quando um Markdown muda no disco', async () => {
    const filepath = path.join(booksDir, 'livro-mutavel.md')
    await fs.writeFile(
      filepath,
      [
        '---',
        'title: Livro Inicial',
        'author: Autora',
        'status: lendo',
        'added_at: "2026-04-30"',
        '---',
        '',
        'Notas iniciais.',
      ].join('\n'),
      'utf-8',
    )

    const context = createStorageContext('user-1', path.join(tmpDir, 'app'), { booksDir })
    await expect(loadLibrarySnapshot(context)).resolves.toMatchObject({
      books: [expect.objectContaining({ title: 'Livro Inicial' })],
    })

    await fs.writeFile(
      filepath,
      [
        '---',
        'title: Livro Alterado',
        'author: Autora',
        'status: lendo',
        'added_at: "2026-04-30"',
        '---',
        '',
        'Notas alteradas no Obsidian.',
      ].join('\n'),
      'utf-8',
    )

    const snapshot = await loadLibrarySnapshot(context)

    expect(snapshot.books).toEqual([
      expect.objectContaining({
        _notes: 'Notas alteradas no Obsidian.',
        title: 'Livro Alterado',
      }),
    ])
  })
})
