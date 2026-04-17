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
import { MessageBubble } from '../message-bubble'
import type { LibrarianClientMessage } from '@/app/api/chat/route'

// next/image mocked to plain <img> (see library-book-card-inline.test.tsx for rationale)
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
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img src={src} alt={alt} width={width} height={height} className={className} />
  ),
}))

const realBook: ChatBookMeta = {
  slug: 'real',
  title: 'Grande Sertão',
  author: 'Rosa',
  status: 'lido',
}

function renderWithLibrary(
  ui: ReactElement,
  books: ChatBookMeta[] = [realBook],
) {
  return render(
    <KnownLibraryProvider books={books}>{ui}</KnownLibraryProvider>,
  )
}

// Build a LibrarianClientMessage fixture using the structural shape; the
// AI SDK generic params aren't enforced at runtime, so we cast via unknown.
function makeMessage(
  role: 'user' | 'assistant',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parts: any[],
  id = 'm1',
): LibrarianClientMessage {
  return {
    id,
    role,
    parts,
  } as unknown as LibrarianClientMessage
}

describe('MessageBubble', () => {
  test('renders user message with right alignment', () => {
    const msg = makeMessage('user', [{ type: 'text', text: 'Oi' }])
    const { container } = renderWithLibrary(
      <MessageBubble message={msg} isLastAssistantStreaming={false} />,
    )
    const wrapper = container.querySelector('[data-role="user"]')
    expect(wrapper).not.toBeNull()
    expect(wrapper?.className).toMatch(/justify-end/)
    expect(screen.getByText('Oi')).toBeInTheDocument()
  })

  test('renders assistant text with AvatarMonogram', () => {
    const msg = makeMessage('assistant', [
      { type: 'text', text: 'Olá, caro leitor.' },
    ])
    renderWithLibrary(
      <MessageBubble message={msg} isLastAssistantStreaming={false} />,
    )
    expect(screen.getByLabelText('Dona Flora')).toBeInTheDocument()
    expect(screen.getByText('Olá, caro leitor.')).toBeInTheDocument()
  })

  test('renders LibraryBookCardInline for known slug tool-output', () => {
    const msg = makeMessage('assistant', [
      { type: 'text', text: 'Que tal este:' },
      {
        type: 'tool-render_library_book_card',
        state: 'output-available',
        output: { slug: 'real' },
      },
    ])
    renderWithLibrary(
      <MessageBubble message={msg} isLastAssistantStreaming={false} />,
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/books/real')
  })

  test('renders neutral fallback for unknown slug tool-output (AI-08 layered guard)', () => {
    const msg = makeMessage('assistant', [
      {
        type: 'tool-render_library_book_card',
        state: 'output-available',
        output: { slug: 'nao-existe' },
      },
    ])
    const { container } = renderWithLibrary(
      <MessageBubble message={msg} isLastAssistantStreaming={false} />,
    )
    expect(
      screen.getByText('(livro mencionado indisponível)'),
    ).toBeInTheDocument()
    // CRITICAL AI-08: no <a> rendered for the hallucinated slug — the card was
    // never mounted, so there's no way it could generate a broken link.
    expect(container.querySelector('a')).toBeNull()
  })

  test('renders ExternalBookMention for external tool-output', () => {
    const msg = makeMessage('assistant', [
      {
        type: 'tool-render_external_book_mention',
        state: 'output-available',
        output: {
          title: 'Doutor Pasavento',
          author: 'Vila-Matas',
          reason: 'densidade narrativa',
        },
      },
    ])
    renderWithLibrary(
      <MessageBubble message={msg} isLastAssistantStreaming={false} />,
    )
    const note = screen.getByRole('note')
    expect(note).toBeInTheDocument()
    // "externo" tag surfaces the external nature of the mention
    expect(screen.getByText('externo')).toBeInTheDocument()
  })

  test('skips tool parts with state !== output-available without crashing', () => {
    const msg = makeMessage('assistant', [
      { type: 'text', text: 'Pensando...' },
      {
        type: 'tool-render_library_book_card',
        state: 'input-streaming',
      },
      {
        type: 'tool-render_external_book_mention',
        state: 'input-available',
      },
    ])
    const { container } = renderWithLibrary(
      <MessageBubble message={msg} isLastAssistantStreaming={false} />,
    )
    // Text still rendered
    expect(screen.getByText('Pensando...')).toBeInTheDocument()
    // Library card is rendered as a layout-stable skeleton (aria-hidden div)
    const skeletons = container.querySelectorAll('[aria-hidden="true"]')
    // At least one aria-hidden div beyond the avatar's inner aria-hidden 'DF'
    expect(skeletons.length).toBeGreaterThanOrEqual(1)
    // No link rendered since output is unavailable
    expect(container.querySelector('a')).toBeNull()
    // No external book note rendered
    expect(screen.queryByRole('note')).toBeNull()
  })

  test('appends StreamingCursor to last text part when isLastAssistantStreaming is true', () => {
    const msg = makeMessage('assistant', [
      { type: 'text', text: 'Começando a resposta' },
    ])
    const { container } = renderWithLibrary(
      <MessageBubble message={msg} isLastAssistantStreaming={true} />,
    )
    // Streaming cursor: a narrow aria-hidden inline span with bg-zinc-400
    const cursor = container.querySelector(
      'span.inline-block.w-\\[2px\\].bg-zinc-400',
    )
    expect(cursor).not.toBeNull()
  })
})
