'use client'

import { AvatarMonogram } from './avatar-monogram'
import { MessageText } from './message-text'
import { LibraryBookCardInline } from './library-book-card-inline'
import { ExternalBookMention } from './external-book-mention'
import { StreamingCursor } from './streaming-cursor'
import { ReadingTrailArtifact } from './reading-trail-artifact'
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
 * AI-04 trail detection heuristic (UI-D11): scan the message parts for a run
 * of 2+ CONSECUTIVE `tool-render_library_book_card` parts that resolved to
 * known slugs. Text parts (or any other part type) between cards break the
 * run. When multiple groups exist, return the first — keeps the UI quiet
 * in the rare multi-trail assistant turn (WR-10: this single-group policy
 * is INTENTIONAL, not an oversight; a dev-only warning fires on the 2nd+
 * group so we can spot the case if it actually occurs in practice).
 *
 * Returns:
 *   - array of slugs when a qualifying group is found, OR
 *   - null when no group of 2+ exists.
 */
function detectTrail(
  parts: LooseMessagePart[],
  knownSlugs: Set<string>,
): string[] | null {
  const groups: string[][] = []
  let current: string[] = []
  for (const p of parts) {
    const slug = p?.output?.slug as string | undefined
    if (
      p?.type === 'tool-render_library_book_card' &&
      p?.state === 'output-available' &&
      typeof slug === 'string' &&
      knownSlugs.has(slug)
    ) {
      current.push(slug)
    } else {
      if (current.length >= 2) groups.push(current)
      current = []
    }
  }
  if (current.length >= 2) groups.push(current)
  // WR-10: surface multi-group turns in dev so we can decide whether to
  // relax the single-group policy later. Prod stays quiet.
  if (groups.length > 1 && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.info(
      '[MessageBubble] detectTrail: found',
      groups.length,
      'consecutive-card groups; rendering only the first (single-group policy, WR-10)',
      groups,
    )
  }
  return groups[0] ?? null
}

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
 * Alignment / palette: user bubbles right-aligned with the primary accent;
 * assistant bubbles left-aligned with AvatarMonogram and card/secondary surfaces
 * from the Phase 5 token set.
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
      <div data-role="user" className="my-3 flex justify-end">
        <div className="max-w-[75ch] rounded-lg rounded-br-sm bg-primary px-4 py-2.5 whitespace-pre-wrap break-words text-primary-foreground">
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

  // AI-04 heuristic: surface a trail artifact below the bubble when the
  // assistant produced 2+ consecutive known-library cards. The inline cards
  // still render inside the bubble — the artifact is an additional structured
  // view with a Save-to-disk affordance, not a replacement of the conversation
  // flow.
  const trail = detectTrail(parts, knownSlugs)

  return (
    <div
      data-role="assistant"
      className="my-3 flex flex-col items-start gap-0"
    >
      <div className="flex justify-start gap-2">
        <AvatarMonogram className="bg-secondary text-secondary-foreground shadow-mac-sm" />
        <div className="min-w-0 max-w-[75ch] break-words rounded-lg rounded-bl-sm border border-border bg-card px-4 py-2.5 text-card-foreground shadow-mac-sm">
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
                      className="my-1 h-16 w-64 rounded-lg border border-border/60 bg-muted motion-safe:animate-pulse"
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
      {trail && (
        <div className="ml-10 mt-2 w-full max-w-[75ch]">
          <ReadingTrailArtifact slugs={trail} />
        </div>
      )}
    </div>
  )
}
