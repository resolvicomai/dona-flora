'use client'

import { Fragment } from 'react'
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

type PseudoToolSegment =
  | { type: 'text'; text: string }
  | { type: 'library-card'; slug: string }
  | { type: 'external-book'; title: string; author: string; reason: string }

const PSEUDO_TOOL_CALL_REGEX =
  /\[?\s*(?:chama\s+)?(render_library_book_card|render_external_book_mention)\(\{([^{}]*)\}\)\s*\]?/g

function readQuotedField(input: string, field: string) {
  const match = new RegExp(`${field}\\s*:\\s*(['"])(.*?)\\1`).exec(input)
  return match?.[2]?.trim()
}

function splitPseudoToolCalls(text: string): PseudoToolSegment[] {
  const segments: PseudoToolSegment[] = []
  let cursor = 0

  for (const match of text.matchAll(PSEUDO_TOOL_CALL_REGEX)) {
    const index = match.index ?? 0
    if (index > cursor) {
      segments.push({ type: 'text', text: text.slice(cursor, index) })
    }

    const toolName = match[1]
    const args = match[2] ?? ''

    if (toolName === 'render_library_book_card') {
      const slug = readQuotedField(args, 'slug')
      if (slug) {
        segments.push({ type: 'library-card', slug })
      }
    }

    if (toolName === 'render_external_book_mention') {
      const title = readQuotedField(args, 'title')
      const author = readQuotedField(args, 'author')
      const reason = readQuotedField(args, 'reason')
      if (title && author && reason) {
        segments.push({ type: 'external-book', title, author, reason })
      }
    }

    cursor = index + match[0].length
  }

  if (cursor < text.length) {
    segments.push({ type: 'text', text: text.slice(cursor) })
  }

  return segments.length > 0 ? segments : [{ type: 'text', text }]
}

function renderTextWithPseudoTools(text: string, keyPrefix: string) {
  return splitPseudoToolCalls(text).map((segment, index) => {
    const key = `${keyPrefix}-${index}`

    if (segment.type === 'library-card') {
      return <LibraryBookCardInline key={key} slug={segment.slug} className="my-2" />
    }

    if (segment.type === 'external-book') {
      return (
        <ExternalBookMention
          key={key}
          title={segment.title}
          author={segment.author}
          reason={segment.reason}
        />
      )
    }

    if (segment.text.trim().length === 0) {
      return null
    }

    return <MessageText key={key} text={segment.text} />
  })
}

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
function detectTrail(parts: LooseMessagePart[], knownSlugs: Set<string>): string[] | null {
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
    console.info(
      '[MessageBubble] detectTrail: found',
      groups.length,
      'consecutive-card groups; rendering only the first (single-group policy, WR-10)',
      groups,
    )
  }
  return groups[0] ?? null
}

function detectStreamingTrailState(
  parts: LooseMessagePart[],
  knownSlugs: Set<string>,
): { isPending: boolean; slugs: string[] } | null {
  const slugs: string[] = []
  let isPending = false

  for (const part of parts) {
    if (part?.type !== 'tool-render_library_book_card') continue
    const slug = part?.output?.slug as string | undefined
    if (part.state === 'output-available' && typeof slug === 'string' && knownSlugs.has(slug)) {
      if (!slugs.includes(slug)) {
        slugs.push(slug)
      }
      continue
    }
    isPending = true
  }

  if (!isPending) return null
  if (slugs.length === 0) return null
  return { isPending: true, slugs }
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
 *  - unknown part types → null. The AI SDK can emit transient stream parts
 *    that do not map to visible UI, so this renderer stays quiet during UAT.
 *
 * Alignment / palette: user bubbles right-aligned with the primary accent;
 * assistant bubbles left-aligned with AvatarMonogram and card/secondary surfaces
 * from the Phase 5 token set.
 *
 * Streaming cursor: when `isLastAssistantStreaming` is true, <StreamingCursor />
 * is appended inline after the LAST text part only — tool parts do not get a
 * cursor (UI-SPEC §Streaming Affordances §Typography).
 */
export function MessageBubble({ message, isLastAssistantStreaming }: MessageBubbleProps) {
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
        <div className="chat-user-bubble max-w-[62ch] rounded-lg rounded-br-sm px-4 py-3 whitespace-pre-wrap break-words shadow-mac-sm">
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
  const streamingTrail = isLastAssistantStreaming
    ? detectStreamingTrailState(parts, knownSlugs)
    : null
  const trailArtifact = trail ? { isPending: false, slugs: trail } : streamingTrail

  return (
    <div data-role="assistant" className="my-4 flex flex-col items-start gap-0">
      <div className="flex justify-start gap-3">
        <AvatarMonogram />
        <div className="chat-assistant-panel min-w-0 max-w-[68ch] break-words rounded-bl-sm px-4 py-4">
          {parts.map((part, i) => {
            switch (part.type) {
              case 'text':
                return (
                  <Fragment key={i}>
                    {renderTextWithPseudoTools(part.text as string, `text-${i}`)}
                    {isLastAssistantStreaming && i === lastTextIndex ? <StreamingCursor /> : null}
                  </Fragment>
                )

              case 'tool-render_library_book_card': {
                if (part.state !== 'output-available') {
                  // Layout-stable skeleton to avoid card-shaped content jump once
                  // the tool resolves (AI-SPEC §Streaming Affordances §Partial-content).
                  return (
                    <div
                      key={i}
                      className="my-1 h-16 w-64 rounded-md border border-hairline bg-surface motion-safe:animate-pulse"
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
                return null
            }
          })}
        </div>
      </div>
      {trailArtifact && (
        <div className="ml-12 mt-2 w-full max-w-[75ch]">
          <ReadingTrailArtifact isPending={trailArtifact.isPending} slugs={trailArtifact.slugs} />
        </div>
      )}
    </div>
  )
}
