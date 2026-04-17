'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ChatSidebarItem } from './chat-sidebar-item'
import { SidebarEmptyState } from './sidebar-empty-state'
import type { ChatSummary } from '@/lib/chats/schema'
import { cn } from '@/lib/utils'

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

export function SidebarBody({ chats, activeChatId }: Props) {
  if (chats.length === 0) return <SidebarEmptyState />
  return (
    <div className="flex flex-col gap-1 p-2">
      {chats.map((c) => (
        <ChatSidebarItem key={c.id} chat={c} active={c.id === activeChatId} />
      ))}
    </div>
  )
}

export function ChatSidebar({ chats, activeChatId }: Props) {
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
          render={<Link href="/chat" />}
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
