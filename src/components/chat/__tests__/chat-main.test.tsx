/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { ChatMain } from '../chat-main'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
    replace: jest.fn(),
  }),
}))

jest.mock('@ai-sdk/react', () => ({
  useChat: () => ({
    error: null,
    messages: [],
    regenerate: jest.fn(),
    sendMessage: jest.fn(),
    status: 'ready',
    stop: jest.fn(),
  }),
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
})
