import type { Book, BookStatus } from '../schema'
import {
  foldGenre,
  extractGenres,
  createFuse,
  applyFilters,
  applySearch,
  applySort,
  type FilterState,
} from '../query'

const base: Book = {
  title: 'X',
  author: ['Y'],
  status: 'quero-ler' as BookStatus,
  added_at: '2026-01-01',
  _notes: '',
}
const mk = (o: Partial<Book>): Book => ({ ...base, ...o })

const EMPTY: FilterState = {
  status: [],
  rating: [],
  genre: [],
  q: '',
  sort: 'added_at',
  dir: 'desc',
}

describe('foldGenre', () => {
  it('strips diacritics and lowercases', () => {
    expect(foldGenre('Ficção')).toBe('ficcao')
    expect(foldGenre('  História Antiga ')).toBe('historia antiga')
  })
  it('returns empty for undefined', () => {
    expect(foldGenre(undefined)).toBe('')
  })
})

describe('extractGenres', () => {
  it('dedupes by fold key and preserves first-seen casing, sorts pt-BR', () => {
    const books = [
      mk({ genre: 'Ficção' }),
      mk({ genre: 'ficcao' }),
      mk({ genre: 'História' }),
      mk({ genre: undefined }),
      mk({ genre: 'FICCAO' }),
    ]
    const out = extractGenres(books)
    expect(out).toHaveLength(2)
    expect(out.map((g) => g.key).sort()).toEqual(['ficcao', 'historia'])
    expect(out.find((g) => g.key === 'ficcao')!.label).toBe('Ficção')
    expect(out.find((g) => g.key === 'historia')!.label).toBe('História')
  })
})

describe('applyFilters', () => {
  const corpus: Book[] = [
    mk({ _filename: 'a.md', status: 'lido', rating: 5, genre: 'Ficção' }),
    mk({ _filename: 'b.md', status: 'lido', rating: 4, genre: 'História' }),
    mk({ _filename: 'c.md', status: 'quero-reler', rating: 5, genre: 'Ficção' }),
    mk({ _filename: 'd.md', status: 'lendo', genre: 'Filosofia' }),
    mk({ _filename: 'e.md', status: 'abandonado', rating: 3, genre: undefined }),
  ]
  it('returns all with empty state', () => {
    expect(applyFilters(corpus, EMPTY)).toHaveLength(corpus.length)
  })
  it('filters by status (OR within type)', () => {
    const out = applyFilters(corpus, { ...EMPTY, status: ['lido', 'quero-reler'] })
    expect(out.map((b) => b._filename)).toEqual(['a.md', 'b.md', 'c.md'])
  })
  it('rating EXACT match excludes null-rating and non-matching ratings', () => {
    const out = applyFilters(corpus, { ...EMPTY, rating: [4, 5] })
    expect(out.map((b) => b._filename)).toEqual(['a.md', 'b.md', 'c.md'])
  })
  it('genre uses folded lowercase', () => {
    const out = applyFilters(corpus, { ...EMPTY, genre: ['ficcao'] })
    expect(out.map((b) => b._filename)).toEqual(['a.md', 'c.md'])
  })
  it('combines types with AND', () => {
    const out = applyFilters(corpus, { ...EMPTY, status: ['lido'], rating: [5] })
    expect(out.map((b) => b._filename)).toEqual(['a.md'])
  })
})

describe('applySearch', () => {
  const corpus: Book[] = [
    mk({ _filename: 'a.md', title: 'O Senhor dos Anéis', author: ['J.R.R. Tolkien'] }),
    mk({ _filename: 'b.md', title: 'Clean Code', author: ['Robert C. Martin'] }),
    mk({
      _filename: 'c.md',
      title: 'Meditações',
      author: ['Marco Aurélio'],
      _notes: 'estoicismo e caminhos',
    }),
  ]
  const fuse = createFuse(corpus)
  it('returns input when query is empty or whitespace', () => {
    expect(applySearch(fuse, corpus, '')).toEqual(corpus)
    expect(applySearch(fuse, corpus, '   ')).toEqual(corpus)
  })
  it('tolerates typos + missing accents in title', () => {
    const out = applySearch(fuse, corpus, 'senhor aneis')
    expect(out.some((b) => b._filename === 'a.md')).toBe(true)
  })
  it('matches by author', () => {
    const out = applySearch(fuse, corpus, 'tolkien')
    expect(out.some((b) => b._filename === 'a.md')).toBe(true)
  })
  it('matches by _notes', () => {
    const out = applySearch(fuse, corpus, 'estoicismo')
    expect(out.some((b) => b._filename === 'c.md')).toBe(true)
  })
  it('ranks the most relevant match first (was returning library order)', () => {
    // Regression: shouldSort was off so a query like "kai fu" surfaced
    // unrelated books in the library order instead of the actual
    // matching title at the top.
    const targetCorpus: Book[] = [
      mk({ _filename: 'noise-1.md', title: 'Beast in the Machine', author: ['G. Dougherty'] }),
      mk({ _filename: 'noise-2.md', title: 'A Pequena Fadette', author: ['George Sand'] }),
      mk({
        _filename: 'target.md',
        title: 'AI Superpowers',
        author: ['Kai-Fu Lee'],
      }),
    ]
    const targetFuse = createFuse(targetCorpus)
    const out = applySearch(targetFuse, targetCorpus, 'kai fu')
    // The Kai-Fu Lee book must come first, not buried below noise.
    expect(out[0]?._filename).toBe('target.md')
  })

  it('does not return books whose only "match" is a 2-char overlap in notes', () => {
    // Regression: with threshold 0.4 + minMatchCharLength 2 + _notes weight
    // 1, every long-form note matched almost any short query.
    const noisyCorpus: Book[] = [
      mk({
        _filename: 'unrelated.md',
        title: 'Cem Anos de Solidão',
        author: ['García Márquez'],
        _notes:
          'um livro com muitas anotações sobre família, tempo, história, fé e memória '.repeat(8),
      }),
    ]
    const noisyFuse = createFuse(noisyCorpus)
    expect(applySearch(noisyFuse, noisyCorpus, 'kai fu')).toHaveLength(0)
  })

  it('intersects with pre-filtered set', () => {
    const filtered = [corpus[0]] // only Tolkien
    const out = applySearch(fuse, filtered, 'tolkien')
    expect(out).toHaveLength(1)
    // Martin is in the index but not in filtered -> must not appear
    const outMartin = applySearch(fuse, filtered, 'martin')
    expect(outMartin).toHaveLength(0)
  })
})

describe('applySort', () => {
  const corpus: Book[] = [
    mk({ _filename: 'a.md', title: 'Árvore', author: ['A'], rating: 3, added_at: '2026-04-01' }),
    mk({ _filename: 'b.md', title: 'Balé', author: ['B'], rating: 5, added_at: '2026-04-10' }),
    mk({ _filename: 'c.md', title: 'Cão', author: ['C'], added_at: '2026-03-30' }),
  ]
  it('sorts title asc with pt-BR collation', () => {
    const out = applySort(corpus, 'title', 'asc')
    expect(out.map((b) => b._filename)).toEqual(['a.md', 'b.md', 'c.md'])
  })
  it('sorts rating desc with null rating last', () => {
    const out = applySort(corpus, 'rating', 'desc')
    expect(out.map((b) => b._filename)).toEqual(['b.md', 'a.md', 'c.md'])
  })
  it('sorts added_at desc (recent first)', () => {
    const out = applySort(corpus, 'added_at', 'desc')
    expect(out.map((b) => b._filename)).toEqual(['b.md', 'a.md', 'c.md'])
  })
})
