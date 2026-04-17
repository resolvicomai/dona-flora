'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { ChatSummary } from '@/lib/chats/schema'

interface ChatSidebarItemProps {
  chat: ChatSummary
  active: boolean
}

/**
 * Single conversation entry in the sidebar.
 *
 * - Full item is a `<Link>` (tap target >= 44px) to `/chat/{id}`.
 * - Active state: `aria-current="page"` + left-border accent (UI-SPEC §Color).
 * - Timestamp uses date-fns `formatDistanceToNow` with pt-BR locale, yielding
 *   strings like "há 2 horas" / "há 1 dia" (UI-SPEC §Copywriting, D-10).
 * - Focus-visible ring mirrors the Phase 3 BookRow accessibility contract.
 */
export function ChatSidebarItem({ chat, active }: ChatSidebarItemProps) {
  const updated = new Date(chat.updated_at)
  const label = Number.isNaN(updated.getTime())
    ? ''
    : formatDistanceToNow(updated, { locale: ptBR, addSuffix: true })

  return (
    <Link
      href={`/chat/${chat.id}`}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex flex-col gap-1 rounded-xl p-3 transition-colors min-h-[44px] no-underline',
        'hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
        active && 'bg-zinc-800 border-l-2 border-zinc-100',
      )}
    >
      <p className="text-sm font-semibold text-zinc-100 line-clamp-1">{chat.title}</p>
      {label && (
        <time dateTime={chat.updated_at} className="text-xs text-zinc-400">
          {label}
        </time>
      )}
    </Link>
  )
}
