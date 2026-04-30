import { buildCoverPlaceholderSVG, isExternalPlaceholderCover } from '../cache'
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

  it('wraps long placeholder titles instead of rendering one clipped line', () => {
    const svg = buildCoverPlaceholderSVG({
      author: ['Oded Galor'],
      title: 'A Jornada da Humanidade: As origens da riqueza e da desigualdade',
    })

    expect(svg).toContain('<tspan')
    expect(svg).toContain('A Jornada da')
    expect(svg).toContain('Humanidade: As')
    expect(svg).not.toContain(
      'A Jornada da Humanidade: As origens da riqueza e da desigualdade</tspan>',
    )
  })

  it('detects external placeholder providers that should not be cached as covers', () => {
    expect(isExternalPlaceholderCover('https://placehold.co/600x900/png?text=Livro')).toBe(true)
    expect(isExternalPlaceholderCover('https://via.placeholder.com/600x900.png')).toBe(true)
    expect(isExternalPlaceholderCover('https://covers.openlibrary.org/b/id/123-L.jpg')).toBe(false)
    expect(isExternalPlaceholderCover('not a url')).toBe(false)
  })
})
