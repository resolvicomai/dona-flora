'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import {
  shouldOfferExternalPreference,
  type ExternalPreference,
} from '@/lib/ai/external-preference'
import { ChatSidebarDrawer } from './chat-sidebar-drawer'
import { ExternalPreferenceToggle } from './external-preference-toggle'
import { MessageList } from './message-list'
import { Composer } from './composer'
import { getChatCopy } from './chat-language'
import type { ChatListEntry } from '@/lib/chats/list'
import type { LibrarianMessage } from '@/lib/chats/types'
import type { ChatGenerationStatus } from '@/lib/chats/schema'
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
  initialGenerationStatus?: ChatGenerationStatus
  initialLastError?: string
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
function createLocalChatId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `chat-${Math.random().toString(36).slice(2, 10)}`
}

function useStableChatId(chatId?: string): string {
  const generatedChatId = useRef<string | null>(null)

  useEffect(() => {
    if (chatId) {
      generatedChatId.current = null
    }
  }, [chatId])

  if (chatId) {
    return chatId
  }

  generatedChatId.current ??= createLocalChatId()
  return generatedChatId.current
}

export function ChatMain({
  chatId,
  initialGenerationStatus = 'complete',
  initialLastError,
  initialMessages,
  chats,
  bookCount,
  seedBook,
}: ChatMainProps) {
  const router = useRouter()
  const { locale } = useAppLanguage()
  const copy = getChatCopy(locale)
  const effectiveChatId = useStableChatId(chatId)
  const [input, setInput] = useState('')
  const [externalPreference, setExternalPreference] = useState<ExternalPreference | null>(null)
  const [remoteGenerationStatus, setRemoteGenerationStatus] =
    useState<ChatGenerationStatus>(initialGenerationStatus)
  const [remoteLastError, setRemoteLastError] = useState(initialLastError ?? '')
  const seedApplied = useRef(false)
  const externalPreferenceRef = useRef<ExternalPreference | null>(null)
  const hydratedChatId = useRef<string | null>(null)
  const localGenerationInFlight = useRef(false)
  const submitLocked = useRef(false)
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

  const { messages, sendMessage, setMessages, status, stop, regenerate, error } =
    useChat<LibrarianClientMessage>({
      id: effectiveChatId,
      messages: memoInitialMessages,
      transport: new DefaultChatTransport<LibrarianClientMessage>({
        api: '/api/chat',
        body: () => ({
          chatId: effectiveChatId,
          externalPreference: externalPreferenceRef.current,
        }),
      }),
      onFinish: () => {
        localGenerationInFlight.current = false
        submitLocked.current = false
        setRemoteGenerationStatus('complete')
        setRemoteLastError('')
        // Refresh once so the sidebar list picks up the newly persisted
        // conversation (ChatPage re-reads listChats()). Skip on subsequent
        // turns: the entry is already rendered and listChats() is O(N files).
        if (hasRefreshedSidebar.current) return
        hasRefreshedSidebar.current = true
        if (!chatId) {
          router.replace(`/chat/${effectiveChatId}`)
          return
        }
        router.refresh()
      },
    })

  const shouldShowExternalPreference =
    externalPreference === 'ambos' ||
    externalPreference === 'externo' ||
    shouldOfferExternalPreference({
      messages,
      preference: externalPreference,
    })

  // Deep-link seed: on first mount when ?about=slug was resolved to a
  // `seedBook` server-side, pre-fill the composer in the active app language.
  // Strip the query param so refreshes don't re-apply the seed — but only
  // when we actually applied the seed; otherwise a stray re-render (WR-01)
  // would strip `?about` before the seed had a chance to take.
  useEffect(() => {
    if (seedApplied.current) return
    if (!seedBook) return
    if (input !== '') return
    if ((messages?.length ?? 0) !== 0) return

    setInput(copy.main.seedBook(seedBook.title, seedBook.author))
    seedApplied.current = true
    router.replace('/chat')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copy, seedBook])

  useEffect(() => {
    externalPreferenceRef.current = externalPreference
  }, [externalPreference])

  useEffect(() => {
    externalPreferenceRef.current = null
    setExternalPreference(null)
    setRemoteGenerationStatus(initialGenerationStatus)
    setRemoteLastError(initialLastError ?? '')
  }, [effectiveChatId, initialGenerationStatus, initialLastError])

  useEffect(() => {
    if (!chatId || hydratedChatId.current === chatId) return
    if (localGenerationInFlight.current) return
    hydratedChatId.current = chatId
    setMessages((initialMessages ?? []) as unknown as LibrarianClientMessage[])
  }, [chatId, initialMessages, setMessages])

  useEffect(() => {
    if (status === 'error' || (status === 'ready' && remoteGenerationStatus !== 'generating')) {
      localGenerationInFlight.current = false
      submitLocked.current = false
    }
  }, [remoteGenerationStatus, status])

  useEffect(() => {
    if (status !== 'ready') return
    if (remoteGenerationStatus !== 'generating') return
    if (localGenerationInFlight.current) return

    let cancelled = false

    async function pollChat() {
      try {
        const res = await fetch(`/api/chats/${effectiveChatId}`, { cache: 'no-store' })
        if (!res.ok) return
        const payload = (await res.json()) as {
          chat?: { generation_status?: ChatGenerationStatus; last_error?: string }
          messages?: LibrarianClientMessage[]
        }
        if (cancelled || !payload.chat) return

        const nextStatus = payload.chat.generation_status ?? 'complete'
        setRemoteGenerationStatus(nextStatus)
        setRemoteLastError(payload.chat.last_error ?? '')
        if (Array.isArray(payload.messages)) {
          setMessages(payload.messages)
        }
      } catch {
        // Polling is a visual affordance; the next tick can recover.
      }
    }

    void pollChat()
    const interval = window.setInterval(() => void pollChat(), 2000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [effectiveChatId, remoteGenerationStatus, setMessages, status])

  async function persistDraft(nextMessages: LibrarianClientMessage[]) {
    const res = await fetch(`/api/chats/${effectiveChatId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: nextMessages }),
    })
    if (!res.ok) {
      throw new Error(`Draft save failed: ${res.status}`)
    }
  }

  function createDraftUserMessage(text: string): LibrarianClientMessage {
    return {
      id: `local-${Date.now()}`,
      role: 'user',
      parts: [{ type: 'text', text }],
    } as unknown as LibrarianClientMessage
  }

  function handleSubmit() {
    const text = input.trim()
    if (!text || displayStatus !== 'ready') return
    if (submitLocked.current) return

    submitLocked.current = true
    localGenerationInFlight.current = true
    setInput('')
    setRemoteGenerationStatus('generating')
    setRemoteLastError('')

    const nextMessages = [...messages, createDraftUserMessage(text)]
    void persistDraft(nextMessages).catch(() => {
      // /api/chat also persists before model generation; this is a fast-path
      // so navigation never shows an empty chat while the stream is starting.
    })

    void sendMessage({ text })
    if (!chatId) {
      router.replace(`/chat/${effectiveChatId}`)
    }
  }

  const title = messages.length === 0 ? copy.main.newConversation : copy.main.conversation
  const displayStatus =
    status === 'ready' && remoteGenerationStatus === 'generating'
      ? 'submitted'
      : status === 'ready' && remoteGenerationStatus === 'error'
        ? 'error'
        : status
  const displayError = error ?? (remoteLastError ? new Error(remoteLastError) : null)

  return (
    <div className="brand-window flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <header className="z-10 flex min-h-14 shrink-0 items-center gap-2 border-b border-hairline-strong bg-surface px-4 md:px-6">
        <ChatSidebarDrawer
          trigger={
            <Button
              variant="secondary"
              size="icon"
              aria-label={copy.main.openHistoryAria}
              className="h-10 w-10 min-h-[44px] min-w-[44px] xl:hidden"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </Button>
          }
          chats={chats}
          activeChatId={effectiveChatId}
        />
        <div className="min-w-0">
          <p className="eyebrow">{copy.main.brandEyebrow}</p>
          <h2 className="truncate text-sm font-medium text-foreground">{title}</h2>
        </div>
      </header>

      {/* One-shot aria-live announcement while a turn is pending first text. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {status === 'submitted' || status === 'streaming' ? copy.main.responding : ''}
      </div>

      <MessageList
        messages={messages}
        status={displayStatus}
        error={displayError}
        onRetry={() => {
          // WR-05: a pending stream must be cancelled before asking useChat
          // to restart, otherwise two streams race, double-persist via
          // onFinish, and double-render tokens during the interim.
          if (status === 'submitted' || status === 'streaming') {
            stop()
          }
          setRemoteGenerationStatus('generating')
          setRemoteLastError('')
          void regenerate()
        }}
        bookCount={bookCount}
      />
      {shouldShowExternalPreference ? (
        <div className="px-4 md:px-6">
          <ExternalPreferenceToggle value={externalPreference} onChange={setExternalPreference} />
        </div>
      ) : null}
      <Composer
        input={input}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        onStop={() => stop()}
        status={displayStatus}
        autoFocusOnMount={Boolean(seedBook)}
      />
    </div>
  )
}
