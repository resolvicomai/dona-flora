import { buildCoverPlaceholderSVG } from '../cache'
import { getCoverRoute } from '../url'

describe('cover helpers', () => {
  it('creates authenticated cover route only for safe slugs', () => {
    expect(getCoverRoute('grande-sertao.md')).toBe('/api/covers/grande-sertao')
    expect(getCoverRoute('../secret')).toBeUndefined()
  })

  it('generates deterministic local SVG placeholders', () => {
    const book = {
      author: ['Autora'],
      title: 'Livro Sem Capa',
    }

    expect(buildCoverPlaceholderSVG(book)).toBe(buildCoverPlaceholderSVG(book))
    expect(buildCoverPlaceholderSVG(book)).toContain('Livro Sem Capa')
    expect(buildCoverPlaceholderSVG(book)).toContain('Autora')
  })
})
