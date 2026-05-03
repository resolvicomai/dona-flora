/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import { ChatMain } from '../chat-main'
import type { LibrarianMessage } from '@/lib/chats/types'

// Draft messages use crypto.randomUUID() when available (jsdom 30+) and fall
// back to a `draft-XXXXXX-TS` id otherwise. Tests accept either shape so they
// stay stable across environments.
const DRAFT_ID_PATTERN =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|draft-[a-z0-9]+-[a-z0-9]+)$/i

const mockRefresh = jest.fn()
const mockReplace = jest.fn()
const mockSetMessages = jest.fn()
const mockSendMessage = jest.fn()
const mockStop = jest.fn()
type MockUseChatOptions = { onFinish?: () => void }
type MockComposerProps = {
  input: string
  onInputChange: (value: string) => void
  onSubmit: () => void
}
let mockUseChatOptions: MockUseChatOptions | null = null
let mockComposerProps: MockComposerProps | null = null
let mockMessages: LibrarianMessage[] = []
let mockStatus: 'ready' | 'submitted' | 'streaming' | 'error' = 'ready'

function composer(): MockComposerProps {
  if (!mockComposerProps) throw new Error('Composer mock has not been rendered yet')
  return mockComposerProps
}

function useChatOptions(): MockUseChatOptions {
  if (!mockUseChatOptions) throw new Error('useChat mock has not been called yet')
  return mockUseChatOptions
}

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
    replace: mockReplace,
  }),
}))

jest.mock('@ai-sdk/react', () => ({
  useChat: (options: MockUseChatOptions) => {
    mockUseChatOptions = options
    return {
      error: null,
      messages: mockMessages,
      regenerate: jest.fn(),
      sendMessage: mockSendMessage,
      setMessages: mockSetMessages,
      status: mockStatus,
      stop: mockStop,
    }
  },
}))

jest.mock('ai', () => ({
  DefaultChatTransport: class DefaultChatTransport {},
}))

jest.mock('../chat-sidebar-drawer', () => ({
  ChatSidebarDrawer: ({ trigger }: { trigger: React.ReactNode }) => (
    <div data-testid="chat-sidebar-drawer">{trigger}</div>
  ),
}))

jest.mock('../external-preference-toggle', () => ({
  ExternalPreferenceToggle: () => <div data-testid="external-preference-toggle" />,
}))

jest.mock('../message-list', () => ({
  MessageList: () => <div data-testid="message-list" />,
}))

jest.mock('../composer', () => ({
  Composer: (props: MockComposerProps) => {
    mockComposerProps = props
    return <form aria-label="composer-mock" />
  },
}))

describe('ChatMain layout chrome', () => {
  beforeEach(() => {
    mockRefresh.mockClear()
    mockReplace.mockClear()
    mockSetMessages.mockClear()
    mockSendMessage.mockClear()
    mockSendMessage.mockResolvedValue(undefined)
    mockStop.mockClear()
    mockUseChatOptions = null
    mockComposerProps = null
    mockMessages = []
    mockStatus = 'ready'
    global.fetch = jest.fn(async () => ({ ok: true })) as jest.Mock
  })

  test('keeps the in-panel header in normal flow instead of sticky positioning', () => {
    render(<ChatMain chats={[]} bookCount={3} seedBook={null} />)

    const title = screen.getByText('Nova conversa')
    const header = title.closest('header')

    expect(header).not.toBeNull()
    expect(header?.className).not.toContain('sticky')
    expect(header?.className).not.toContain('top-[var(--app-nav-offset)]')
  })

  test('moves a newly saved /chat conversation to its explicit /chat/{id} route', () => {
    render(<ChatMain chats={[]} bookCount={3} seedBook={null} />)

    useChatOptions().onFinish?.()

    expect(mockReplace).toHaveBeenCalledTimes(1)
    expect(mockReplace.mock.calls[0][0]).toMatch(/^\/chat\/[A-Za-z0-9][A-Za-z0-9_-]*$/)
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  test('hydrates messages when the generated chat route receives server messages', async () => {
    const serverMessages: LibrarianMessage[] = [
      {
        id: 'user-1',
        role: 'user',
        parts: [{ type: 'text', text: 'Oi' }],
      },
      {
        id: 'assistant-1',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Tudo bem. Como posso ajudar?' }],
      },
    ]

    const { rerender } = render(<ChatMain chats={[]} bookCount={3} seedBook={null} />)

    rerender(
      <ChatMain
        chatId="chat-123"
        initialMessages={serverMessages}
        chats={[]}
        bookCount={3}
        seedBook={null}
      />,
    )

    await waitFor(() => expect(mockSetMessages).toHaveBeenCalledWith(serverMessages))
  })

  test('does not issue any GET fetch to /api/chats/{id} during a streaming turn', async () => {
    const fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'PUT') return { ok: true }
      return { ok: true }
    }) as jest.Mock
    global.fetch = fetchMock

    render(<ChatMain chatId="chat-123" chats={[]} bookCount={3} seedBook={null} />)

    await act(async () => {
      composer().onInputChange('Oi')
    })
    await waitFor(() => expect(composer().input).toBe('Oi'))

    await act(async () => {
      composer().onSubmit()
    })

    await act(async () => {
      useChatOptions().onFinish?.()
    })

    const getCalls = fetchMock.mock.calls.filter(
      ([, init]) => !init || (init as RequestInit | undefined)?.method !== 'PUT',
    )
    expect(getCalls).toEqual([])
  })

  test('does not overwrite a live new-chat stream with the server draft after route navigation', async () => {
    const draftMessages: LibrarianMessage[] = [
      {
        id: 'user-1',
        role: 'user',
        parts: [{ type: 'text', text: 'Oi Dona Flora' }],
      },
    ]

    const { rerender } = render(<ChatMain chats={[]} bookCount={3} seedBook={null} />)

    await act(async () => {
      composer().onInputChange('Oi Dona Flora')
    })
    await waitFor(() => expect(composer().input).toBe('Oi Dona Flora'))

    await act(async () => {
      composer().onSubmit()
    })

    mockSetMessages.mockClear()

    rerender(
      <ChatMain
        chatId="chat-123"
        initialGenerationStatus="generating"
        initialMessages={draftMessages}
        chats={[]}
        bookCount={3}
        seedBook={null}
      />,
    )

    await waitFor(() => expect(mockReplace).toHaveBeenCalled())
    expect(mockSetMessages).not.toHaveBeenCalledWith(draftMessages)
  })

  test('does not wait for draft persistence before sending the message to the model', async () => {
    let resolveDraft!: () => void
    global.fetch = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveDraft = () => resolve({ ok: true })
        }),
    ) as jest.Mock

    render(<ChatMain chatId="chat-123" chats={[]} bookCount={3} seedBook={null} />)

    await act(async () => {
      composer().onInputChange('Uma pergunta')
    })
    await waitFor(() => expect(composer().input).toBe('Uma pergunta'))

    await act(async () => {
      composer().onSubmit()
    })

    expect(mockSendMessage).toHaveBeenCalledTimes(1)
    expect(mockSendMessage).toHaveBeenCalledWith({
      text: 'Uma pergunta',
      messageId: expect.stringMatching(DRAFT_ID_PATTERN),
    })

    await act(async () => {
      resolveDraft()
    })
  })

  test('shows the user draft immediately before transport or persistence settles', async () => {
    let resolveDraft!: () => void
    global.fetch = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveDraft = () => resolve({ ok: true })
        }),
    ) as jest.Mock
    mockSendMessage.mockImplementation(() => new Promise(() => {}))

    render(<ChatMain chatId="chat-123" chats={[]} bookCount={3} seedBook={null} />)

    await act(async () => {
      composer().onInputChange('Oi agora')
    })
    await waitFor(() => expect(composer().input).toBe('Oi agora'))

    await act(async () => {
      composer().onSubmit()
    })

    expect(mockSetMessages).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.stringMatching(DRAFT_ID_PATTERN),
          role: 'user',
          parts: [{ type: 'text', text: 'Oi agora' }],
        }),
      ]),
    )
    expect(mockSendMessage).toHaveBeenCalledWith({
      text: 'Oi agora',
      messageId: expect.stringMatching(DRAFT_ID_PATTERN),
    })

    await act(async () => {
      resolveDraft()
    })
  })

  test('does not navigate a new conversation before the draft file exists', async () => {
    let resolveDraft!: () => void
    global.fetch = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveDraft = () => resolve({ ok: true })
        }),
    ) as jest.Mock

    render(<ChatMain chats={[]} bookCount={3} seedBook={null} />)

    await act(async () => {
      composer().onInputChange('Oi')
    })
    await waitFor(() => expect(composer().input).toBe('Oi'))

    await act(async () => {
      composer().onSubmit()
    })

    expect(mockSendMessage).toHaveBeenCalledTimes(1)
    expect(mockReplace).not.toHaveBeenCalled()

    await act(async () => {
      resolveDraft()
    })

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledTimes(1)
      expect(mockReplace.mock.calls[0][0]).toMatch(/^\/chat\/[A-Za-z0-9][A-Za-z0-9_-]*$/)
    })
  })

  test('ignores duplicate submits while the same turn is being sent', async () => {
    render(<ChatMain chatId="chat-123" chats={[]} bookCount={3} seedBook={null} />)

    await act(async () => {
      composer().onInputChange('Uma pergunta')
    })
    await waitFor(() => expect(composer().input).toBe('Uma pergunta'))

    await act(async () => {
      composer().onSubmit()
      composer().onSubmit()
    })

    expect(mockSendMessage).toHaveBeenCalledTimes(1)
  })

})
