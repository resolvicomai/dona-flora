/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { ChatMain } from '../chat-main'

const mockRefresh = jest.fn()
const mockReplace = jest.fn()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockUseChatOptions: any = null

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
    replace: mockReplace,
  }),
}))

jest.mock('@ai-sdk/react', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useChat: (options: any) => {
    mockUseChatOptions = options
    return {
    error: null,
    messages: [],
    regenerate: jest.fn(),
    sendMessage: jest.fn(),
    status: 'ready',
    stop: jest.fn(),
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
  Composer: () => <form aria-label="composer-mock" />,
}))

describe('ChatMain layout chrome', () => {
  beforeEach(() => {
    mockRefresh.mockClear()
    mockReplace.mockClear()
    mockUseChatOptions = null
  })

  test('keeps the in-panel header in normal flow instead of sticky positioning', () => {
    render(
      <ChatMain
        chats={[]}
        bookCount={3}
        seedBook={null}
      />,
    )

    const title = screen.getByText('Nova conversa')
    const header = title.closest('header')

    expect(header).not.toBeNull()
    expect(header?.className).not.toContain('sticky')
    expect(header?.className).not.toContain('top-[var(--app-nav-offset)]')
  })

  test('moves a newly saved /chat conversation to its explicit /chat/{id} route', () => {
    render(
      <ChatMain
        chats={[]}
        bookCount={3}
        seedBook={null}
      />,
    )

    mockUseChatOptions.onFinish()

    expect(mockReplace).toHaveBeenCalledTimes(1)
    expect(mockReplace.mock.calls[0][0]).toMatch(
      /^\/chat\/[A-Za-z0-9][A-Za-z0-9_-]*$/,
    )
    expect(mockRefresh).not.toHaveBeenCalled()
  })
})
