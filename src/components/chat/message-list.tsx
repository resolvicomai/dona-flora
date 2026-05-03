'use client'

import { useEffect, useRef } from 'react'
import { MessageBubble } from './message-bubble'
import { WelcomeState } from './welcome-state'
import { MessageErrorState } from './message-error-state'
import { AvatarMonogram } from './avatar-monogram'
import { TypingDots } from './typing-dots'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { getChatCopy } from './chat-language'
import type { LibrarianClientMessage } from '@/app/api/chat/route'

interface MessageListProps {
  messages: LibrarianClientMessage[]
  status: 'ready' | 'submitted' | 'streaming' | 'error'
  error: Error | null
  onRetry: () => void
  bookCount: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseMessagePart = any

/**
 * Scrollable message region with:
 *  - Welcome state when `messages.length === 0`.
 *  - `AvatarMonogram + TypingDots` bubble when status is 'submitted' and the
 *    last visible turn is a user message (pre-first-token indicator).
 *  - `MessageErrorState` card under the last bubble when status is 'error'.
 *  - Auto-scroll to bottom on message change IF the user has not scrolled
 *    more than 120px above the bottom (UI-SPEC §Streaming Affordances §Scroll).
 *  - `aria-live="polite"` region mirroring the current assistant text for
 *    assistive tech (UI-SPEC §Accessibility Contract lines 487-488).
 *
 * Implementation notes:
 *  - `isAtBottomRef` is a ref (not state) because we do not want re-renders
 *    when the scroll position changes — we just need the latest flag when
 *    deciding whether to auto-scroll on new messages.
 */
export function MessageList({ messages, status, error, onRetry, bookCount }: MessageListProps) {
  const { locale } = useAppLanguage()
  const copy = getChatCopy(locale)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const near = el.scrollTop + el.clientHeight >= el.scrollHeight - 120
    isAtBottomRef.current = near
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (isAtBottomRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, status])

  const visibleMessages = messages.filter(hasVisibleMessageContent)
  const lastMessage = visibleMessages[visibleMessages.length - 1]
  const lastMessageText = lastMessage?.role === 'assistant' ? getMessageText(lastMessage) : ''
  const isAssistantStreaming =
    status === 'streaming' && lastMessage?.role === 'assistant' && lastMessageText.trim().length > 0
  const shouldShowThinkingBubble =
    (status === 'submitted' || status === 'streaming') &&
    (!lastMessage || lastMessage.role === 'user')

  // aria-live mirror of the current assistant message's text; browsers throttle
  // polite announcements natively, so we just reflect the latest concatenated text.
  const announceText = lastMessage?.role === 'assistant' ? lastMessageText : ''

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 scroll-pb-6 md:px-6 md:py-6"
    >
      <div className="mx-auto w-full max-w-4xl">
        {visibleMessages.length === 0 ? (
          <WelcomeState bookCount={bookCount} />
        ) : (
          <>
            {visibleMessages.map((m, i) => (
              <MessageBubble
                key={m.id ?? i}
                message={m}
                isLastAssistantStreaming={isAssistantStreaming && i === visibleMessages.length - 1}
              />
            ))}
            {shouldShowThinkingBubble && (
              <div className="my-4 flex justify-start gap-3">
                <AvatarMonogram />
                <div
                  role="status"
                  aria-label={copy.messageList.thinkingAria}
                  className="chat-thinking-panel rounded-bl-sm px-4 py-2.5"
                >
                  <TypingDots />
                </div>
              </div>
            )}
            {status === 'error' && <MessageErrorState error={error} onRetry={onRetry} />}
          </>
        )}

        <div aria-live="polite" aria-atomic="false" className="sr-only">
          {announceText}
        </div>
      </div>
    </div>
  )
}

function getMessageText(message: LibrarianClientMessage): string {
  return ((message.parts ?? []) as LooseMessagePart[])
    .filter((p) => p.type === 'text')
    .map((p) => p.text as string)
    .join(' ')
}

function hasVisibleMessageContent(message: LibrarianClientMessage): boolean {
  const parts = (message.parts ?? []) as LooseMessagePart[]

  if (message.role === 'user') {
    // A user message with id but no parts yet is in the brief swap window
    // between the optimistic draft and AI SDK's reconciled message. Render
    // an empty bubble shell rather than hide the row, so the user never
    // sees their message vanish — the bubble fills in within a frame.
    if (parts.length === 0 && typeof message.id === 'string' && message.id.length > 0) {
      return true
    }
    return getMessageText(message).trim().length > 0
  }

  if (message.role !== 'assistant') {
    return false
  }

  return parts.some((part) => {
    if (part?.type === 'text') {
      return String(part.text ?? '').trim().length > 0
    }

    if (part?.type === 'tool-render_library_book_card') {
      return true
    }

    if (part?.type === 'tool-render_external_book_mention') {
      return part.state === 'output-available'
    }

    return false
  })
}
