/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { KnownLibraryProvider, type ChatBookMeta } from '../known-library-context'
import { MessageList } from '../message-list'
import type { LibrarianClientMessage } from '@/app/api/chat/route'

const book: ChatBookMeta = {
  slug: 'livro',
  title: 'Um Livro',
  author: 'Uma Pessoa',
  status: 'lido',
}

function makeMessage(role: 'user' | 'assistant', text: string, id = role): LibrarianClientMessage {
  return {
    id,
    role,
    parts: [{ type: 'text', text }],
  } as unknown as LibrarianClientMessage
}

function renderMessageList(props: Partial<React.ComponentProps<typeof MessageList>> = {}) {
  return render(
    <KnownLibraryProvider books={[book]}>
      <MessageList
        messages={[]}
        status="ready"
        error={null}
        onRetry={jest.fn()}
        bookCount={1}
        {...props}
      />
    </KnownLibraryProvider>,
  )
}

describe('MessageList pending and error feedback', () => {
  test('shows a thinking bubble while streaming before visible assistant text arrives', () => {
    renderMessageList({
      messages: [makeMessage('user', 'Oi')],
      status: 'streaming',
    })

    expect(screen.getByRole('status', { name: 'Dona Flora está pensando' })).toBeInTheDocument()
    expect(screen.getAllByLabelText('Dona Flora')).toHaveLength(1)
  })

  test('keeps the thinking bubble when the assistant message is still empty', () => {
    renderMessageList({
      messages: [makeMessage('user', 'Oi', 'user-1'), makeMessage('assistant', '', 'assistant-1')],
      status: 'streaming',
    })

    expect(screen.getByRole('status', { name: 'Dona Flora está pensando' })).toBeInTheDocument()
  })

  test('renders user message with id but empty parts (mid-swap) instead of hiding it', () => {
    const draftWithEmptyParts = {
      id: 'draft-uuid-123',
      role: 'user',
      parts: [],
    } as unknown as LibrarianClientMessage

    renderMessageList({
      messages: [draftWithEmptyParts],
      status: 'submitted',
    })

    // Render path is: any user message with an id renders, even if parts
    // momentarily empty — so the user never sees "my message vanished."
    // The Welcome state would otherwise paint, so its sentinel must be absent.
    expect(screen.queryByText(/Sou a Dona Flora/)).not.toBeInTheDocument()
  })

  test('shows a clearer local provider error when chat generation fails', () => {
    renderMessageList({
      messages: [makeMessage('user', 'Oi')],
      status: 'error',
      error: new Error('Ollama local não respondeu em http://127.0.0.1:11434/v1'),
    })

    expect(screen.getByText(/Ollama local não respondeu/)).toBeInTheDocument()
    expect(screen.getByText(/Configurações/)).toBeInTheDocument()
  })
})
