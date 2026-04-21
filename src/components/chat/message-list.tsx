'use client'

import { useEffect, useRef } from 'react'
import { MessageBubble } from './message-bubble'
import { WelcomeState } from './welcome-state'
import { MessageErrorState } from './message-error-state'
import { AvatarMonogram } from './avatar-monogram'
import { TypingDots } from './typing-dots'
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
export function MessageList({
  messages,
  status,
  error,
  onRetry,
  bookCount,
}: MessageListProps) {
  void error
  const scrollRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const near =
      el.scrollTop + el.clientHeight >= el.scrollHeight - 120
    isAtBottomRef.current = near
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (isAtBottomRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, status])

  const lastMessage = messages[messages.length - 1]
  const isAssistantStreaming =
    status === 'streaming' && lastMessage?.role === 'assistant'

  // aria-live mirror of the current assistant message's text; browsers throttle
  // polite announcements natively, so we just reflect the latest concatenated text.
  const announceText =
    lastMessage?.role === 'assistant'
      ? ((lastMessage.parts ?? []) as LooseMessagePart[])
          .filter((p) => p.type === 'text')
          .map((p) => p.text as string)
          .join(' ')
      : ''

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6"
    >
      <div className="mx-auto w-full max-w-4xl">
        {messages.length === 0 ? (
          <WelcomeState bookCount={bookCount} />
        ) : (
          <>
            {messages.map((m, i) => (
              <MessageBubble
                key={m.id ?? i}
                message={m}
                isLastAssistantStreaming={
                  isAssistantStreaming && i === messages.length - 1
                }
              />
            ))}
            {status === 'submitted' && lastMessage?.role === 'user' && (
              <div className="my-4 flex justify-start gap-3">
                <AvatarMonogram />
                <div className="panel-solid rounded-[1.6rem] rounded-bl-[0.6rem] px-4 py-2.5">
                  <TypingDots />
                </div>
              </div>
            )}
            {status === 'error' && <MessageErrorState onRetry={onRetry} />}
          </>
        )}

        <div
          aria-live="polite"
          aria-atomic="false"
          className="sr-only"
        >
          {announceText}
        </div>
      </div>
    </div>
  )
}
