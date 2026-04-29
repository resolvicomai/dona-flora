'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { KnownLibraryProvider, type ChatBookMeta } from './known-library-context'
import { ChatSidebar } from './chat-sidebar'
import { ChatMain } from './chat-main' // Placeholder in this plan; Plan 06 replaces with streaming UI.
import type { ChatListEntry } from '@/lib/chats/list'
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
  chats: ChatListEntry[]
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
      <div className="page-frame flex h-full min-h-0 flex-1 gap-3 py-3 md:gap-4 md:py-4">
        <ChatSidebar chats={chats} activeChatId={chatId} />
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <ChatMain
            chatId={chatId}
            initialMessages={initialMessages}
            chats={chats}
            bookCount={bookCount}
            seedBook={seedBook ?? null}
          />
        </section>
      </div>
    </KnownLibraryProvider>
  )
}
