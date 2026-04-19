'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { ChatSidebarDrawer } from './chat-sidebar-drawer'
import { MessageList } from './message-list'
import { Composer } from './composer'
import type { ChatListEntry } from '@/lib/chats/list'
import type { LibrarianMessage } from '@/lib/chats/types'
import type { LibrarianClientMessage } from '@/app/api/chat/route'

/**
 * Props contract preserved EXACTLY from the Plan 05 placeholder so ChatShell's
 * call site does not need updating when Plan 06 lands.
 *
 * - `chatId` is undefined on `/chat` (new conversation); defined on `/chat/[id]`.
 * - `initialMessages` hydrates `useChat` for existing conversations.
 * - `chats` feeds the mobile drawer sidebar.
 * - `bookCount` drives pluralization in WelcomeState.
 * - `seedBook` is produced by the server when `/chat?about={slug}` is visited;
 *   the composer pre-fills with a pt-BR seed message on first mount.
 */
export interface ChatMainProps {
  chatId?: string
  initialMessages?: LibrarianMessage[]
  chats: ChatListEntry[]
  bookCount: number
  seedBook: { slug: string; title: string; author: string } | null
}

/**
 * Returns a stable chat id for the lifetime of this component instance.
 *
 * - If `chatId` is provided (i.e. the URL is `/chat/[id]`), use it unchanged.
 * - Otherwise generate one via `crypto.randomUUID()` on first render and keep
 *   the same id across re-renders (the useChat hook keys its state by id).
 *
 * crypto.randomUUID() yields values starting with alphanumerics and containing
 * only `[0-9A-Fa-f-]`, which passes the Plan 03 Zod regex
 * `^[A-Za-z0-9][A-Za-z0-9_-]*$`.
 */
function useStableChatId(chatId?: string): string {
  const ref = useRef<string | null>(null)
  if (ref.current === null) {
    if (chatId) {
      ref.current = chatId
    } else if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      ref.current = crypto.randomUUID()
    } else {
      ref.current = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    }
  }
  return ref.current
}

export function ChatMain({
  chatId,
  initialMessages,
  chats,
  bookCount,
  seedBook,
}: ChatMainProps) {
  const router = useRouter()
  const effectiveChatId = useStableChatId(chatId)
  const [input, setInput] = useState('')
  const seedApplied = useRef(false)
  // WR-02: listChats() readdirs data/chats/ + parses every .md on every
  // refresh. The sidebar entry for this conversation appears after the
  // FIRST persisted assistant turn; subsequent turns only update
  // `updated_at`, so we skip the refresh after that. Existing conversations
  // (chatId provided via URL) are already in the sidebar on mount.
  const hasRefreshedSidebar = useRef<boolean>(Boolean(chatId))

  // Memoize initialMessages to stabilize the useChat prop reference across
  // renders (WR-04). useChat v6 does not guarantee behavior when `messages`
  // changes identity mid-session; freezing to the first-mount value matches
  // the "hydrate once" Plan 06 contract.
  const memoInitialMessages = useRef(
    (initialMessages ?? []) as unknown as LibrarianClientMessage[],
  ).current

  const { messages, sendMessage, status, stop, regenerate, error } =
    useChat<LibrarianClientMessage>({
      id: effectiveChatId,
      messages: memoInitialMessages,
      transport: new DefaultChatTransport<LibrarianClientMessage>({
        api: '/api/chat',
        body: { chatId: effectiveChatId },
      }),
      onFinish: () => {
        // Refresh once so the sidebar list picks up the newly persisted
        // conversation (ChatPage re-reads listChats()). Skip on subsequent
        // turns: the entry is already rendered and listChats() is O(N files).
        if (hasRefreshedSidebar.current) return
        hasRefreshedSidebar.current = true
        router.refresh()
      },
    })

  // Deep-link seed: on first mount when ?about=slug was resolved to a
  // `seedBook` server-side, pre-fill the composer in pt-BR without sending.
  // Strip the query param so refreshes don't re-apply the seed — but only
  // when we actually applied the seed; otherwise a stray re-render (WR-01)
  // would strip `?about` before the seed had a chance to take.
  useEffect(() => {
    if (seedApplied.current) return
    if (!seedBook) return
    if (input !== '') return
    if ((messages?.length ?? 0) !== 0) return

    setInput(
      `Conte-me mais sobre "${seedBook.title}" de ${seedBook.author}. O que você acha dessa minha escolha?`,
    )
    seedApplied.current = true
    router.replace('/chat')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedBook])

  function handleSubmit() {
    if (!input.trim() || status !== 'ready') return
    void sendMessage({ text: input })
    setInput('')
  }

  const title = messages.length === 0 ? 'Nova conversa' : 'Conversa'

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-950">
      <header className="h-14 sticky top-0 z-10 flex items-center gap-2 px-4 md:px-8 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <ChatSidebarDrawer
          trigger={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Abrir histórico de conversas"
              className="lg:hidden"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </Button>
          }
          chats={chats}
          activeChatId={effectiveChatId}
        />
        <h2 className="text-sm font-semibold text-zinc-300 truncate">
          {title}
        </h2>
      </header>

      {/* One-shot aria-live announcement when a new turn enters 'submitted'. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {status === 'submitted' ? 'Dona Flora está respondendo.' : ''}
      </div>

      <MessageList
        messages={messages}
        status={status}
        error={error ?? null}
        onRetry={() => {
          // WR-05: a pending stream must be cancelled before asking useChat
          // to restart, otherwise two streams race, double-persist via
          // onFinish, and double-render tokens during the interim.
          if (status === 'submitted' || status === 'streaming') {
            stop()
          }
          void regenerate()
        }}
        bookCount={bookCount}
      />
      <Composer
        input={input}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        onStop={() => stop()}
        status={status}
        autoFocusOnMount={Boolean(seedBook)}
      />
    </div>
  )
}
