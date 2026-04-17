'use client'

import { AvatarMonogram } from './avatar-monogram'
import { MessageText } from './message-text'
import { LibraryBookCardInline } from './library-book-card-inline'
import { ExternalBookMention } from './external-book-mention'
import { StreamingCursor } from './streaming-cursor'
import { useKnownSlugs } from './known-library-context'
import type { LibrarianClientMessage } from '@/app/api/chat/route'

interface MessageBubbleProps {
  message: LibrarianClientMessage
  isLastAssistantStreaming: boolean
}

// The AI SDK UIMessage.parts array is discriminated by `type` and branches widely
// (text, tool-*, reasoning, data, etc.); the chat surface only renders the subset
// declared by LibrarianTools. Using `any` locally keeps the switch lean without
// threading the full provider union through the component.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseMessagePart = any

/**
 * Per-message renderer dispatching on `part.type` (AI-SPEC §3 table):
 *
 *  - `'text'`                          → <MessageText text={part.text} />
 *  - `'tool-render_library_book_card'` → <LibraryBookCardInline /> when the
 *    slug is known (layered AI-08 guard — `useKnownSlugs().has(slug)` checked
 *    BEFORE mounting the card). Unknown slugs render the D-14 neutral span
 *    directly so the card component never mounts with an invalid slug.
 *  - `'tool-render_external_book_mention'` → <ExternalBookMention />
 *  - unknown part types → null in prod; console.warn in dev (AI-SPEC pitfall #3).
 *
 * Alignment / palette: user bubbles right-aligned with zinc-100 accent; assistant
 * bubbles left-aligned with AvatarMonogram and zinc-900 surface (UI-SPEC §Color).
 *
 * Streaming cursor: when `isLastAssistantStreaming` is true, <StreamingCursor />
 * is appended inline after the LAST text part only — tool parts do not get a
 * cursor (UI-SPEC §Streaming Affordances §Typography).
 */
export function MessageBubble({
  message,
  isLastAssistantStreaming,
}: MessageBubbleProps) {
  const knownSlugs = useKnownSlugs()

  if (message.role === 'system') return null

  const parts = (message.parts ?? []) as LooseMessagePart[]

  if (message.role === 'user') {
    // User turns should only contain text parts; join them into a single string.
    const text = parts
      .filter((p) => p.type === 'text')
      .map((p) => p.text as string)
      .join('')
    return (
      <div data-role="user" className="flex justify-end my-4">
        <div className="bg-zinc-100 text-zinc-900 rounded-2xl rounded-br-md px-4 py-2 max-w-[75ch] whitespace-pre-wrap break-words">
          {text}
        </div>
      </div>
    )
  }

  // Index of the last text part so we know where to hang the streaming cursor.
  let lastTextIndex = -1
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]?.type === 'text') lastTextIndex = i
  }

  return (
    <div data-role="assistant" className="flex justify-start gap-2 my-4">
      <AvatarMonogram />
      <div className="bg-zinc-900 text-zinc-100 rounded-2xl rounded-bl-md px-4 py-3 max-w-[75ch] min-w-0 break-words">
        {parts.map((part, i) => {
          switch (part.type) {
            case 'text':
              return (
                <span key={i}>
                  <MessageText text={part.text as string} />
                  {isLastAssistantStreaming && i === lastTextIndex ? (
                    <StreamingCursor />
                  ) : null}
                </span>
              )

            case 'tool-render_library_book_card': {
              if (part.state !== 'output-available') {
                // Layout-stable skeleton to avoid card-shaped content jump once
                // the tool resolves (AI-SPEC §Streaming Affordances §Partial-content).
                return (
                  <div
                    key={i}
                    className="h-16 w-64 rounded-xl bg-zinc-800/70 my-1 motion-safe:animate-pulse"
                    aria-hidden="true"
                  />
                )
              }
              const slug = (part.output?.slug ?? '') as string
              if (!knownSlugs.has(slug)) {
                // Layered D-14 guardrail: unknown slug never mounts the card
                // component. See `LibraryBookCardInline` for the inner fallback.
                return (
                  <span key={i} className="text-muted-foreground italic">
                    (livro mencionado indisponível)
                  </span>
                )
              }
              return <LibraryBookCardInline key={i} slug={slug} />
            }

            case 'tool-render_external_book_mention': {
              if (part.state !== 'output-available') return null
              const out = part.output ?? {}
              return (
                <ExternalBookMention
                  key={i}
                  title={out.title as string}
                  author={out.author as string}
                  reason={out.reason as string}
                />
              )
            }

            default:
              if (process.env.NODE_ENV !== 'production') {
                // eslint-disable-next-line no-console
                console.warn('[MessageBubble] unknown part', part)
              }
              return null
          }
        })}
      </div>
    </div>
  )
}
