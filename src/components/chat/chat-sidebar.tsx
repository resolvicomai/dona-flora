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
import type { ChatSummary } from '@/lib/chats/schema'
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
  chats: ChatSummary[]
  activeChatId?: string
}

/**
 * Filters a chat list by title substring (case/diacritic-insensitive via
 * `String.localeCompare`-style fold). Empty / whitespace query returns the
 * original list unchanged.
 */
function filterChats(chats: ChatSummary[], query: string): ChatSummary[] {
  const q = query.trim().toLowerCase()
  if (!q) return chats
  const folded = q
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  return chats.filter((c) => {
    const t = c.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    return t.includes(folded)
  })
}

export function SidebarBody({ chats, activeChatId }: Props) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => filterChats(chats, query), [chats, query])

  return (
    <div className="flex flex-col gap-2">
      {chats.length > 0 && (
        <div className="relative px-2 pt-2">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Buscar conversas…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar conversas"
            className="pl-8 h-8 text-sm bg-zinc-950 border-zinc-800"
          />
        </div>
      )}
      {chats.length === 0 ? (
        <SidebarEmptyState />
      ) : filtered.length === 0 ? (
        <p className="px-4 py-6 text-sm text-zinc-500 text-center">
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
        'hidden lg:flex flex-col w-72 bg-zinc-900 border-r border-zinc-800 h-full',
      )}
    >
      <header className="flex items-center justify-between gap-2 px-4 py-4 border-b border-zinc-800">
        <h2 className="text-xl font-semibold text-zinc-100">Conversas</h2>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Nova conversa"
          onClick={newChat}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </header>
      <ScrollArea className="flex-1">
        <SidebarBody chats={chats} activeChatId={activeChatId} />
      </ScrollArea>
      <footer className="border-t border-zinc-800 p-3">
        <Link
          href="/"
          className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          ← Biblioteca
        </Link>
      </footer>
    </aside>
  )
}
