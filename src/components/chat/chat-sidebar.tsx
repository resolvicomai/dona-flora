'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { ChatSidebarItem } from './chat-sidebar-item'
import { SidebarEmptyState } from './sidebar-empty-state'
import { getChatCopy } from './chat-language'
import type { ChatListEntry } from '@/lib/chats/list'
import { cn } from '@/lib/utils'

/**
 * "Nova conversa" handler.
 *
 * When already on `/chat` (no id), a Next.js soft navigation does NOT remount
 * ChatMain, so the `useChat` hook keeps prior messages/state and the user sees
 * "nothing happened". A full-page navigation resets client state reliably. If
 * we are elsewhere (e.g. `/chat/{id}`), a normal `router.push` is enough —
 * chatId changes and the downstream components react accordingly.
 */
export function useNewChatHandler() {
  const router = useRouter()
  const pathname = usePathname()
  return () => {
    if (pathname === '/chat') {
      window.location.assign('/chat')
    } else {
      router.push('/chat')
    }
  }
}

/**
 * Desktop persistent sidebar (`w-72`, hidden below `lg`) and its reusable
 * body (`SidebarBody`). The mobile drawer (`ChatSidebarDrawer`) imports
 * `SidebarBody` so empty-state / list rendering is shared.
 *
 * Visual contract comes from UI-SPEC §Layout desktop + §Color.
 */

interface Props {
  chats: ChatListEntry[]
  activeChatId?: string
}

/**
 * Folds a string to lowercase-ASCII so search ignores case and diacritics
 * (so "açorianos" matches "Acorianos").
 */
function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Filters a chat list by matching `query` against BOTH title and body excerpt
 * (case/diacritic-insensitive). Empty / whitespace query returns the original
 * list unchanged.
 */
function filterChats(chats: ChatListEntry[], query: string): ChatListEntry[] {
  const q = fold(query.trim())
  if (!q) return chats
  return chats.filter((c) => {
    return fold(c.title).includes(q) || fold(c.content).includes(q)
  })
}

export function SidebarBody({ chats, activeChatId }: Props) {
  const { locale } = useAppLanguage()
  const copy = getChatCopy(locale)
  const [query, setQuery] = useState('')
  const [localChats, setLocalChats] = useState(chats)
  const filtered = useMemo(() => filterChats(localChats, query), [localChats, query])

  useEffect(() => {
    setLocalChats(chats)
  }, [chats])

  function handleChatUpdated(nextChat: ChatListEntry) {
    setLocalChats((current) =>
      current
        .map((chat) =>
          chat.id === nextChat.id ? { ...chat, ...nextChat, content: chat.content } : chat,
        )
        .sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
          return b.updated_at.localeCompare(a.updated_at)
        }),
    )
  }

  function handleChatDeleted(chatId: string) {
    setLocalChats((current) => current.filter((chat) => chat.id !== chatId))
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 p-3">
      {localChats.length > 0 && (
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder={copy.sidebar.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={copy.sidebar.searchAria}
            className="h-10 pl-10 text-sm"
          />
        </div>
      )}
      {localChats.length === 0 ? (
        <SidebarEmptyState />
      ) : filtered.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          {copy.sidebar.noResults}
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {filtered.map((c) => (
            <ChatSidebarItem
              key={c.id}
              chat={c}
              active={c.id === activeChatId}
              onDeleted={handleChatDeleted}
              onUpdated={handleChatUpdated}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function ChatSidebar({ chats, activeChatId }: Props) {
  const { locale } = useAppLanguage()
  const copy = getChatCopy(locale)
  const newChat = useNewChatHandler()
  return (
    <aside
      className={cn(
        'brand-window hidden h-full min-h-0 shrink-0 overflow-hidden xl:flex xl:w-[18rem] xl:flex-col 2xl:w-[20rem]',
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-4">
        <div>
          <p className="eyebrow">{copy.sidebar.eyebrow}</p>
          <h2 className="mt-2 text-lg font-medium text-foreground">{copy.sidebar.title}</h2>
        </div>
        <Button
          size="icon"
          variant="secondary"
          aria-label={copy.sidebar.newConversationAria}
          onClick={newChat}
          className="h-10 w-10 min-h-[44px] min-w-[44px]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <SidebarBody chats={chats} activeChatId={activeChatId} />
      </ScrollArea>
      <footer className="border-t border-hairline p-3">
        <Link
          href="/"
          className="surface-transition inline-flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
        >
          {copy.sidebar.backToLibrary}
        </Link>
      </footer>
    </aside>
  )
}
