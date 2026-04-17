/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import type { ChatSummary } from '@/lib/chats/schema'
import { ChatSidebarItem } from '../chat-sidebar-item'

function makeChat(overrides: Partial<ChatSummary> = {}): ChatSummary {
  return {
    id: 'chat-123',
    title: 'Conversa sobre Grande Sertão',
    started_at: '2026-04-15T12:00:00.000Z',
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // ~2h ago
    book_refs: [],
    ...overrides,
  }
}

describe('ChatSidebarItem', () => {
  test("renders title and Link href='/chat/{id}'", () => {
    render(<ChatSidebarItem chat={makeChat()} active={false} />)
    expect(screen.getByText('Conversa sobre Grande Sertão')).toBeInTheDocument()
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/chat/chat-123')
  })

  test('renders relative pt-BR timestamp (matches /há/)', () => {
    render(<ChatSidebarItem chat={makeChat()} active={false} />)
    const timeEl = screen.getByRole('time') as HTMLElement | null ?? document.querySelector('time')
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
    const link = screen.getByRole('link')
    expect(link.className).toMatch(/border-l-2/)
    expect(link.className).toMatch(/border-zinc-100/)
  })

  test('renders time element with dateTime attribute', () => {
    const chat = makeChat({ updated_at: '2026-04-15T10:00:00.000Z' })
    render(<ChatSidebarItem chat={chat} active={false} />)
    const timeEl = document.querySelector('time')
    expect(timeEl).not.toBeNull()
    expect(timeEl).toHaveAttribute('dateTime', '2026-04-15T10:00:00.000Z')
  })
})
