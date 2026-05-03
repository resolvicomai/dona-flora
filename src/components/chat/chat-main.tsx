'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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

/**
 * Stable id for the optimistic user draft. AI SDK v6 reconciles messages by
 * `messageId`; we pass this same id to `sendMessage({ messageId })` so the
 * server-echoed message replaces the draft in place rather than appearing as
 * a duplicate or letting the draft vanish during the swap.
 */
function createDraftMessageId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `draft-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
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
  // `pendingTurn` covers the gap between the user submitting and useChat's
  // `status` flipping to 'submitted'. It also flags a server-recorded
  // `'generating'` from a refresh mid-stream so the typing-dots bubble
  // appears without polling.
  const [pendingTurn, setPendingTurn] = useState<boolean>(
    initialGenerationStatus === 'generating',
  )
  const [remoteLastError, setRemoteLastError] = useState(initialLastError ?? '')
  const seedApplied = useRef(false)
  const externalPreferenceRef = useRef<ExternalPreference | null>(null)
  const localGenerationInFlight = useRef(false)
  const submitLocked = useRef(false)
  // Whether the new-chat → /chat/[id] one-shot navigation has already fired.
  // Both call sites (`handleSubmit`'s draftSave.then and `onFinish`) already
  // gate on `!chatId`, so initializing `false` is correct even when the
  // component mounts on /chat/[id] directly.
  const openedExplicitRoute = useRef(false)
  // WR-02: listChats() readdirs data/chats/ + parses every .md on every
  // refresh. The sidebar entry for this conversation appears after the
  // FIRST persisted assistant turn; subsequent turns only update
  // `updated_at`, so we skip the refresh after that. Existing conversations
  // (chatId provided via URL) are already in the sidebar on mount.
  const hasRefreshedSidebar = useRef<boolean>(Boolean(chatId))

  // Memoize initialMessages so useChat re-keys cleanly on `effectiveChatId`
  // change without thrashing the messages reference within a single chat.
  // The useChat hook owns the live state; this prop is only the seed for a
  // freshly-mounted (or freshly-keyed) instance.
  const memoInitialMessages = useMemo(
    () => (initialMessages ?? []) as unknown as LibrarianClientMessage[],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveChatId],
  )

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
        setPendingTurn(false)
        setRemoteLastError('')
        // Refresh once so the sidebar list picks up the newly persisted
        // conversation (ChatPage re-reads listChats()). Skip on subsequent
        // turns: the entry is already rendered and listChats() is O(N files).
        if (hasRefreshedSidebar.current) return
        hasRefreshedSidebar.current = true
        if (!chatId && !openedExplicitRoute.current) {
          openedExplicitRoute.current = true
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
    setPendingTurn(initialGenerationStatus === 'generating')
    setRemoteLastError(initialLastError ?? '')
  }, [chatId, effectiveChatId, initialGenerationStatus, initialLastError])

  useEffect(() => {
    if (status === 'error' || (status === 'ready' && !pendingTurn)) {
      localGenerationInFlight.current = false
      submitLocked.current = false
    }
  }, [pendingTurn, status])

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
      id: createDraftMessageId(),
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
    setPendingTurn(true)
    setRemoteLastError('')

    const draftMessage = createDraftUserMessage(text)
    const nextMessages = [...messages, draftMessage]
    setMessages(nextMessages)
    const draftSave = persistDraft(nextMessages)
    void draftSave.catch(() => {
      // /api/chat also persists before model generation; this is a fast-path
      // so navigation never shows an empty chat while the stream is starting.
    })

    void Promise.resolve(sendMessage({ text, messageId: draftMessage.id })).catch((err) => {
      localGenerationInFlight.current = false
      submitLocked.current = false
      setPendingTurn(false)
      setRemoteLastError(
        err instanceof Error ? err.message : 'A Dona Flora não conseguiu iniciar a resposta.',
      )
    })
    if (!chatId) {
      void draftSave
        .then(() => {
          if (openedExplicitRoute.current) return
          openedExplicitRoute.current = true
          router.replace(`/chat/${effectiveChatId}`)
        })
        .catch(() => {})
    }
  }

  const title = messages.length === 0 ? copy.main.newConversation : copy.main.conversation
  const displayStatus =
    status === 'ready' && pendingTurn
      ? 'submitted'
      : status === 'ready' && remoteLastError
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
          setPendingTurn(true)
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
