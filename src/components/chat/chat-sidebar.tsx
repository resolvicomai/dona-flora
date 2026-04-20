'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChatSidebarItem } from './chat-sidebar-item'
import { SidebarEmptyState } from './sidebar-empty-state'
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
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => filterChats(chats, query), [chats, query])

  return (
    <div className="flex flex-col gap-2">
      {chats.length > 0 && (
        <div className="relative px-3 pt-3">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Buscar conversas…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar conversas"
            className="h-8 border-border bg-background/80 pl-8 text-sm shadow-mac-sm"
          />
        </div>
      )}
      {chats.length === 0 ? (
        <SidebarEmptyState />
      ) : filtered.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          Nenhuma conversa encontrada.
        </p>
      ) : (
        <div className="flex flex-col gap-1 p-2 pt-0">
          {filtered.map((c) => (
            <ChatSidebarItem key={c.id} chat={c} active={c.id === activeChatId} />
          ))}
        </div>
      )}
    </div>
  )
}

export function ChatSidebar({ chats, activeChatId }: Props) {
  const newChat = useNewChatHandler()
  return (
    <aside
      className={cn(
        'sticky top-12 hidden h-[calc(100vh-3rem)] w-72 shrink-0 flex-col border-r border-border bg-card/90 backdrop-blur-xl lg:flex',
      )}
    >
      <header className="flex h-10 items-center justify-between gap-2 border-b border-border px-4">
        <h2 className="text-base font-medium text-foreground">Conversas</h2>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Nova conversa"
          onClick={newChat}
          className="h-8 w-8 min-h-[44px] min-w-[44px] rounded-md border border-border bg-background/80 text-foreground shadow-mac-sm backdrop-blur-xl hover:!bg-accent"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </header>
      <ScrollArea className="flex-1">
        <SidebarBody chats={chats} activeChatId={activeChatId} />
      </ScrollArea>
      <footer className="border-t border-border p-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground surface-transition hover:bg-accent hover:text-foreground"
        >
          ← Biblioteca
        </Link>
      </footer>
    </aside>
  )
}
