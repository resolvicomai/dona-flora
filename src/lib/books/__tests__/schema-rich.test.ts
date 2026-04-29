import { BookSchema } from '../schema'

const baseBook = {
  added_at: '2026-04-29',
  author: 'Autor Um',
  status: 'quero-ler',
  title: 'Livro Rico',
}

describe('BookSchema rich metadata compatibility', () => {
  it('normalizes legacy string author to array and accepts rich optional fields', () => {
    const parsed = BookSchema.parse({
      ...baseBook,
      current_page: 0,
      finished_at: '2026-05-03',
      isbn_10: '0-553-29335-4',
      isbn_13: '978-0-553-29335-7',
      priority: 3,
      progress: 42,
      publisher: 'Editora Teste',
      series: 'Serie Teste',
      series_index: 2,
      started_at: '2026-05-01',
      subtitle: 'Subtitulo',
      synopsis_source: 'manual',
      tags: ['leitura', 'estudar'],
      translator: 'Tradutora',
    })

    expect(parsed.author).toEqual(['Autor Um'])
    expect(parsed.isbn_10).toBe('0553293354')
    expect(parsed.isbn_13).toBe('9780553293357')
    expect(parsed.tags).toEqual(['leitura', 'estudar'])
  })

  it('keeps author arrays as arrays', () => {
    const parsed = BookSchema.parse({
      ...baseBook,
      author: ['Autor Um', 'Autora Dois'],
    })

    expect(parsed.author).toEqual(['Autor Um', 'Autora Dois'])
  })

  it('rejects impossible dates and out-of-range reading fields', () => {
    expect(() =>
      BookSchema.parse({
        ...baseBook,
        added_at: '2026-99-99',
      }),
    ).toThrow()

    expect(() =>
      BookSchema.parse({
        ...baseBook,
        priority: 6,
      }),
    ).toThrow()

    expect(() =>
      BookSchema.parse({
        ...baseBook,
        progress: 101,
      }),
    ).toThrow()
  })
})
