/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
import {
  KnownLibraryProvider,
  type ChatBookMeta,
} from '../known-library-context'
import { ReadingTrailArtifact } from '../reading-trail-artifact'

// next/image: render plain <img> to skip Next's runtime optimizer in jsdom.
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    width,
    height,
    className,
  }: {
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

// next/navigation.useRouter: the artifact calls router.refresh() on save.
const refreshMock = jest.fn()
jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: () => ({
    refresh: refreshMock,
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

const books: ChatBookMeta[] = [
  { slug: 'a-um', title: 'Livro Um', author: 'Autora', status: 'lido' },
  { slug: 'b-dois', title: 'Livro Dois', author: 'Autor', status: 'lendo' },
  {
    slug: 'c-tres',
    title: 'Livro Três',
    author: 'Alguém',
    status: 'quero-ler',
  },
]

function renderWithLibrary(ui: ReactElement) {
  return render(<KnownLibraryProvider books={books}>{ui}</KnownLibraryProvider>)
}

describe('ReadingTrailArtifact', () => {
  beforeEach(() => {
    refreshMock.mockClear()
    // Reset fetch mock between tests to avoid cross-test leakage.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global as any).fetch = jest.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({ slug: 'trilha-1' }),
    }))
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('renders 3 ordered items for 3 slugs with numeric positions', () => {
    renderWithLibrary(
      <ReadingTrailArtifact slugs={['a-um', 'b-dois', 'c-tres']} />,
    )
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
    // Numeric chip for each position.
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  test('each item renders a LibraryBookCardInline link to /books/{slug}', () => {
    renderWithLibrary(
      <ReadingTrailArtifact slugs={['a-um', 'b-dois', 'c-tres']} />,
    )
    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', '/books/a-um')
    expect(links[1]).toHaveAttribute('href', '/books/b-dois')
    expect(links[2]).toHaveAttribute('href', '/books/c-tres')
  })

  test('renders the trail heading and Salvar trilha button in idle state', () => {
    renderWithLibrary(<ReadingTrailArtifact slugs={['a-um', 'b-dois']} />)
    expect(screen.getByText('Trilha de leitura sugerida')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Salvar trilha/i }),
    ).toBeInTheDocument()
  })

  test('clicking Salvar trilha POSTs /api/trails with title + book_refs', async () => {
    renderWithLibrary(
      <ReadingTrailArtifact slugs={['a-um', 'b-dois', 'c-tres']} />,
    )
    const btn = screen.getByRole('button', { name: /Salvar trilha/i })
    await act(async () => {
      fireEvent.click(btn)
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fetchMock = (global as any).fetch as jest.Mock
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/trails')
    expect(init.method).toBe('POST')
    const body = JSON.parse(init.body as string)
    expect(body.book_refs).toEqual(['a-um', 'b-dois', 'c-tres'])
    expect(typeof body.title).toBe('string')
    expect(body.title.length).toBeGreaterThan(0)
  })

  test("shows 'Trilha salva' and an open-trail link after successful save", async () => {
    renderWithLibrary(<ReadingTrailArtifact slugs={['a-um', 'b-dois']} />)
    const btn = screen.getByRole('button', { name: /Salvar trilha/i })
    await act(async () => {
      fireEvent.click(btn)
    })
    await waitFor(() =>
      expect(screen.getByText('Trilha salva')).toBeInTheDocument(),
    )
    expect(
      screen.getByRole('link', { name: /Abrir trilha/i }),
    ).toHaveAttribute('href', '/trails/trilha-1')
  })

  test('calls router.refresh() after a successful save', async () => {
    renderWithLibrary(<ReadingTrailArtifact slugs={['a-um', 'b-dois']} />)
    const btn = screen.getByRole('button', { name: /Salvar trilha/i })
    await act(async () => {
      fireEvent.click(btn)
    })
    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1))
  })

  test('shows Portuguese error text when the fetch fails', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global as any).fetch = jest.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({ error: 'boom' }),
    }))
    renderWithLibrary(<ReadingTrailArtifact slugs={['a-um', 'b-dois']} />)
    const btn = screen.getByRole('button', { name: /Salvar trilha/i })
    await act(async () => {
      fireEvent.click(btn)
    })
    await waitFor(() =>
      expect(
        screen.getByText(/Não consegui salvar a trilha/i),
      ).toBeInTheDocument(),
    )
    // Retry button appears next to the error copy.
    expect(
      screen.getByRole('button', { name: /Tentar novamente/i }),
    ).toBeInTheDocument()
  })

  test('uses suggestedTitle when provided as the POST body title', async () => {
    renderWithLibrary(
      <ReadingTrailArtifact
        slugs={['a-um', 'b-dois']}
        suggestedTitle="Trilha do estoicismo"
      />,
    )
    const btn = screen.getByRole('button', { name: /Salvar trilha/i })
    await act(async () => {
      fireEvent.click(btn)
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fetchMock = (global as any).fetch as jest.Mock
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body.title).toBe('Trilha do estoicismo')
  })
})
