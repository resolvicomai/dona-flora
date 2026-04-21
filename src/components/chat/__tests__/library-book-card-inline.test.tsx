/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import {
  KnownLibraryProvider,
  type ChatBookMeta,
} from '../known-library-context'
import { LibraryBookCardInline } from '../library-book-card-inline'

// next/link is safe in jsdom as it renders a plain <a>; no special mock needed.
// next/image requires a minimal mock to render a plain <img> without Next's
// runtime optimizations.
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height, className }: {
    src: string
    alt: string
    width: number
    height: number
    className?: string
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} className={className} />
  ),
}))

const fixtureBook: ChatBookMeta = {
  slug: 'grande-sertao',
  title: 'Grande Sertão',
  author: 'Rosa',
  status: 'lido',
  cover: 'https://example.com/cover.jpg',
}

function renderWithLibrary(
  ui: ReactElement,
  books: ChatBookMeta[] = [fixtureBook],
) {
  return render(
    <KnownLibraryProvider books={books}>{ui}</KnownLibraryProvider>,
  )
}

describe('LibraryBookCardInline', () => {
  test('renders a link to /books/{slug} when slug is present in library', () => {
    renderWithLibrary(<LibraryBookCardInline slug="grande-sertao" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/books/grande-sertao')
  })

  test('renders the book title and author', () => {
    renderWithLibrary(<LibraryBookCardInline slug="grande-sertao" />)
    expect(screen.getByText('Grande Sertão')).toBeInTheDocument()
    expect(screen.getByText('Rosa')).toBeInTheDocument()
  })

  test('renders the cover image for owned books', () => {
    const { container } = renderWithLibrary(
      <LibraryBookCardInline slug="grande-sertao" />,
    )
    expect(container.querySelector('img')).not.toBeNull()
  })

  test("renders a StatusBadge with the book's status", () => {
    renderWithLibrary(<LibraryBookCardInline slug="grande-sertao" />)
    // StatusBadge renders the label "Lido" for status "lido"
    expect(screen.getByText('Lido')).toBeInTheDocument()
  })

  test('renders neutral italic fallback span when slug is NOT in the library (D-14 guardrail)', () => {
    const { container } = renderWithLibrary(
      <LibraryBookCardInline slug="nao-existe" />,
      [fixtureBook],
    )
    // Exact fallback text per UI-SPEC §Copywriting
    expect(screen.getByText('(livro mencionado indisponível)')).toBeInTheDocument()
    // Must NOT render a link — the whole point of the guardrail
    expect(container.querySelector('a')).toBeNull()
  })

  test('falls back to placeholder cover variant when book has no cover URL', () => {
    const noCoverBook: ChatBookMeta = {
      slug: 'sem-capa',
      title: 'Sem Capa',
      author: 'Autor',
      status: 'quero-ler',
    }
    const { container } = renderWithLibrary(
      <LibraryBookCardInline slug="sem-capa" />,
      [noCoverBook],
    )
    // Placeholder branch of BookCover renders a div with role="img" (not an <img>).
    // We should NOT see a <img> tag since there is no cover URL.
    expect(container.querySelector('img')).toBeNull()
    // Placeholder shows the first initial of the title
    expect(screen.getByText('S')).toBeInTheDocument()
  })

  test('has aria-label with title, author, and status', () => {
    renderWithLibrary(<LibraryBookCardInline slug="grande-sertao" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute(
      'aria-label',
      'Abrir Grande Sertão de Rosa — status lido',
    )
  })
})
