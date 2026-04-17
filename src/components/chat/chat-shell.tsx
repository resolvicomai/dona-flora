'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { KnownLibraryProvider, type ChatBookMeta } from './known-library-context'
import { ChatSidebar } from './chat-sidebar'
import { ChatMain } from './chat-main' // Placeholder in this plan; Plan 06 replaces with streaming UI.
import type { ChatSummary } from '@/lib/chats/schema'
import type { LibrarianMessage } from '@/lib/chats/types'

/**
 * Root client layout for /chat and /chat/[id].
 *
 * Responsibilities:
 * - Thread the library-book metadata through React context so every
 *   descendant (MessageBubble → LibraryBookCardInline) can resolve slugs
 *   without prop-drilling.
 * - Compose desktop sidebar + main chat area.
 * - Global Cmd/Ctrl+K shortcut to start a new conversation (UI-D16).
 *
 * The mobile drawer (`ChatSidebarDrawer`) is owned by `ChatMain` (Plan 06)
 * because its trigger lives inside the chat header, not in the shell.
 */

export interface ChatShellProps {
  chatId?: string
  initialMessages?: LibrarianMessage[]
  chats: ChatSummary[]
  knownBooks: ChatBookMeta[]
  bookCount: number
  seedBook?: { slug: string; title: string; author: string } | null
}

export function ChatShell({
  chatId,
  initialMessages,
  chats,
  knownBooks,
  bookCount,
  seedBook,
}: ChatShellProps) {
  const router = useRouter()

  // UI-D16: Cmd/Ctrl + K = nova conversa. Global listener on /chat.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        router.push('/chat')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router])

  return (
    <KnownLibraryProvider books={knownBooks}>
      <div className="flex flex-1 min-h-0 bg-zinc-950">
        <ChatSidebar chats={chats} activeChatId={chatId} />
        <main className="flex-1 flex flex-col min-w-0">
          <ChatMain
            chatId={chatId}
            initialMessages={initialMessages}
            chats={chats}
            bookCount={bookCount}
            seedBook={seedBook ?? null}
          />
        </main>
      </div>
    </KnownLibraryProvider>
  )
}
