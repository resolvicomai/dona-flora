/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ChatListEntry } from '@/lib/chats/list'

// Mock next/navigation — ChatSidebarItem uses usePathname + useRouter for the
// delete-action bounce-to-/chat behavior.
const mockRefresh = jest.fn()
const mockPush = jest.fn()
let mockPathname = '/chat'

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ refresh: mockRefresh, push: mockPush }),
}))

import { ChatSidebarItem } from '../chat-sidebar-item'

function makeChat(overrides: Partial<ChatListEntry> = {}): ChatListEntry {
  return {
    id: 'chat-123',
    title: 'Conversa sobre Grande Sertão',
    started_at: '2026-04-15T12:00:00.000Z',
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // ~2h ago
    book_refs: [],
    pinned: false,
    title_locked: false,
    generation_status: 'complete',
    content: '## Você — 12:00\n\nQueria falar sobre sertão e travessia.',
    ...overrides,
  }
}

describe('ChatSidebarItem', () => {
  beforeEach(() => {
    mockRefresh.mockClear()
    mockPush.mockClear()
    mockPathname = '/chat'
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 204,
    })) as unknown as typeof fetch
  })

  test("renders title and Link href='/chat/{id}'", () => {
    render(<ChatSidebarItem chat={makeChat()} active={false} />)
    expect(screen.getByText('Conversa sobre Grande Sertão')).toBeInTheDocument()
    expect(screen.getByText(/Queria falar sobre sertão/)).toBeInTheDocument()
    const link = screen.getAllByRole('link')[0]
    expect(link).toHaveAttribute('href', '/chat/chat-123')
  })

  test('keeps action buttons in a compact absolute tray', () => {
    render(<ChatSidebarItem chat={makeChat()} active={false} />)
    const link = screen.getByRole('link')
    const pinButton = screen.getByRole('button', {
      name: 'Fixar conversa Conversa sobre Grande Sertão',
    })
    const tray = pinButton.parentElement as HTMLElement

    expect(link.className).toMatch(/pr-28/)
    expect(tray.className).toMatch(/absolute/)
    expect(tray.className).toMatch(/right-2/)
    expect(tray.className).toMatch(/top-2/)
  })

  test('pins a conversation via PATCH', async () => {
    const user = userEvent.setup()
    const onUpdated = jest.fn()
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ chat: makeChat({ pinned: true }) }),
    })) as unknown as typeof fetch
    render(<ChatSidebarItem chat={makeChat()} active={false} onUpdated={onUpdated} />)

    await user.click(
      screen.getByRole('button', {
        name: 'Fixar conversa Conversa sobre Grande Sertão',
      }),
    )

    expect(global.fetch).toHaveBeenCalledWith('/api/chats/chat-123', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: true }),
    })
    expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ pinned: true }))
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  test('shows an inline update error instead of logging a dev issue', async () => {
    const user = userEvent.setup()
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 500,
    })) as unknown as typeof fetch

    render(<ChatSidebarItem chat={makeChat()} active={false} />)

    await user.click(
      screen.getByRole('button', {
        name: 'Fixar conversa Conversa sobre Grande Sertão',
      }),
    )

    expect(screen.getByText('Não consegui atualizar esta conversa.')).toBeInTheDocument()
    expect(consoleErrorSpy).not.toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  test('renames a conversation via PATCH', async () => {
    const user = userEvent.setup()
    const onUpdated = jest.fn()
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ chat: makeChat({ title: 'Travessias', title_locked: true }) }),
    })) as unknown as typeof fetch
    render(<ChatSidebarItem chat={makeChat()} active={false} onUpdated={onUpdated} />)

    await user.click(
      screen.getByRole('button', {
        name: 'Renomear conversa Conversa sobre Grande Sertão',
      }),
    )
    await user.clear(screen.getByLabelText('Novo nome da conversa'))
    await user.type(screen.getByLabelText('Novo nome da conversa'), 'Travessias')
    await user.click(screen.getByRole('button', { name: /Salvar/ }))

    expect(global.fetch).toHaveBeenCalledWith('/api/chats/chat-123', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Travessias' }),
    })
    expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ title: 'Travessias' }))
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  test('renders relative pt-BR timestamp (matches /há/)', () => {
    render(<ChatSidebarItem chat={makeChat()} active={false} />)
    const timeEl =
      (screen.getByRole('time') as HTMLElement | null) ?? document.querySelector('time')
    expect(timeEl).not.toBeNull()
    // pt-BR relative labels from date-fns always use "há" for past times
    expect(timeEl!.textContent ?? '').toMatch(/há/)
  })

  test("adds aria-current='page' when active", () => {
    render(<ChatSidebarItem chat={makeChat()} active={true} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('aria-current', 'page')
  })

  test('does not add aria-current when not active', () => {
    render(<ChatSidebarItem chat={makeChat()} active={false} />)
    const link = screen.getByRole('link')
    expect(link).not.toHaveAttribute('aria-current')
  })

  test('has focus-visible:ring classes', () => {
    render(<ChatSidebarItem chat={makeChat()} active={false} />)
    const link = screen.getByRole('link')
    expect(link.className).toMatch(/focus-visible:ring/)
  })

  test('min-height 44px (touch target)', () => {
    render(<ChatSidebarItem chat={makeChat()} active={false} />)
    const link = screen.getByRole('link')
    expect(link.className).toMatch(/min-h-\[44px\]/)
  })

  test('active state has left-border accent', () => {
    render(<ChatSidebarItem chat={makeChat()} active={true} />)
    // Border accent lives on the wrapper div (which also owns the hover state
    // for the delete action), not on the Link itself.
    const link = screen.getByRole('link')
    const wrapper = link.parentElement as HTMLElement
    expect(wrapper.className).toMatch(/border-l-2/)
    expect(wrapper.className).toMatch(/border-l-primary/)
  })

  test('renders time element with dateTime attribute', () => {
    const chat = makeChat({ updated_at: '2026-04-15T10:00:00.000Z' })
    render(<ChatSidebarItem chat={chat} active={false} />)
    const timeEl = document.querySelector('time')
    expect(timeEl).not.toBeNull()
    expect(timeEl).toHaveAttribute('dateTime', '2026-04-15T10:00:00.000Z')
  })

  test('leaves the active chat after deleting it even when the current pathname is /chat', async () => {
    const user = userEvent.setup()
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(<ChatSidebarItem chat={makeChat()} active={true} />)

    await user.click(
      screen.getByRole('button', {
        name: 'Excluir conversa Conversa sobre Grande Sertão',
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Excluir conversa' }))

    expect(global.fetch).toHaveBeenCalledWith('/api/chats/chat-123', {
      method: 'DELETE',
    })
    expect(mockRefresh).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })
})
