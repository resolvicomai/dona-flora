/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import {
  KnownLibraryProvider,
  useBookMeta,
  useKnownSlugs,
  type ChatBookMeta,
} from '../known-library-context'

const fixtures: ChatBookMeta[] = [
  { slug: 'grande-sertao', title: 'Grande Sertão', author: 'Rosa', status: 'lido' },
  { slug: 'o-hobbit', title: 'O Hobbit', author: 'Tolkien', status: 'lido' },
]

function MetaProbe({ slug }: { slug: string }) {
  const m = useBookMeta(slug)
  return <span data-testid="meta">{m ? m.title : 'null'}</span>
}

function SlugsProbe() {
  const s = useKnownSlugs()
  return <span data-testid="slugs">{[...s].sort().join(',')}</span>
}

describe('KnownLibraryContext', () => {
  test('useBookMeta resolves known slug', () => {
    render(
      <KnownLibraryProvider books={fixtures}>
        <MetaProbe slug="grande-sertao" />
      </KnownLibraryProvider>,
    )
    expect(screen.getByTestId('meta')).toHaveTextContent('Grande Sertão')
  })

  test('useBookMeta returns null for unknown slug', () => {
    render(
      <KnownLibraryProvider books={fixtures}>
        <MetaProbe slug="nao-existe" />
      </KnownLibraryProvider>,
    )
    expect(screen.getByTestId('meta')).toHaveTextContent('null')
  })

  test('useKnownSlugs yields every registered slug', () => {
    render(
      <KnownLibraryProvider books={fixtures}>
        <SlugsProbe />
      </KnownLibraryProvider>,
    )
    expect(screen.getByTestId('slugs')).toHaveTextContent('grande-sertao,o-hobbit')
  })

  test('useBookMeta returns null when provider is absent (graceful degradation)', () => {
    render(<MetaProbe slug="anything" />)
    expect(screen.getByTestId('meta')).toHaveTextContent('null')
  })
})
