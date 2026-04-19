import type { LibrarianMessage, LibrarianMessagePart } from './types'

/**
 * UIMessage[] ↔ Markdown transcript transforms.
 *
 * Canonical body format (AI-SPEC §4, lines 599-620):
 *
 *     ## Você — 15:35
 *
 *     Queria reler Tolkien, por onde começo?
 *
 *     ## Dona Flora — 15:35
 *
 *     A ordem clássica... [[o-hobbit]] primeiro, depois
 *     [[o-senhor-dos-aneis-a-sociedade-do-anel]].
 *     > external: Earthsea — Ursula K. Le Guin — prosa contemplativa parecida
 *
 * Known round-trip losses (documented for Plan 02 consumers):
 * - `metadata.createdAt`: serialize renders `HH:MM` (UTC) for display but parse
 *   returns `undefined` because only the time-of-day is in the Markdown, never
 *   the date. Consumers who need timestamps should read `started_at`/`updated_at`
 *   from the frontmatter and synthesize them as needed.
 * - `id`: parse assigns deterministic `msg-<index>` ids, so an input id like
 *   `u1` does NOT survive a round-trip. Message ORDER is preserved.
 * - `system` role: serialize drops system messages entirely (never persisted).
 */

const SPEAKER_FOR_ROLE: Record<'user' | 'assistant', string> = {
  user: 'Você',
  assistant: 'Dona Flora',
}

const ROLE_FOR_SPEAKER: Record<string, 'user' | 'assistant'> = {
  Você: 'user',
  'Dona Flora': 'assistant',
}

function timeLabel(iso?: string): string {
  if (!iso) return '--:--'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '--:--'
  // UTC HH:MM — deterministic regardless of TZ of the running process.
  return d.toISOString().slice(11, 16)
}

function renderPart(part: LibrarianMessagePart): string | null {
  switch (part.type) {
    case 'text':
      return part.text
    case 'tool-render_library_book_card':
      if (part.state === 'output-available' && part.output?.slug) {
        return `[[${part.output.slug}]]`
      }
      return null
    case 'tool-render_external_book_mention':
      if (part.state === 'output-available' && part.output) {
        const { title, author, reason } = part.output
        return `> external: ${title} — ${author} — ${reason}`
      }
      return null
    default:
      return null
  }
}

export function serializeTranscript(messages: LibrarianMessage[]): string {
  const sections: string[] = []
  for (const msg of messages) {
    if (msg.role === 'system') continue
    const speaker = SPEAKER_FOR_ROLE[msg.role as 'user' | 'assistant']
    if (!speaker) continue

    const heading = `## ${speaker} — ${timeLabel(msg.metadata?.createdAt)}`
    const body = msg.parts
      .map((p) => renderPart(p))
      .filter((s): s is string => s !== null && s !== '')
      .join(' ')
      .trim()
    sections.push(`${heading}\n\n${body}`)
  }
  return sections.join('\n\n')
}

// --- parseTranscript ---------------------------------------------------------

// Heading: `## Você — 15:35` or `## Dona Flora — --:--`. The speaker label is
// the Portuguese word; the time token is treated opaquely.
const HEADING_RE = /^##\s+(Você|Dona Flora)\s+—\s+(\S+)\s*$/gm

// Wiki-link: `[[slug]]`. The lexer regex is permissive (anything between
// the brackets) so a malformed transcript does not silently swallow
// adjacent text; the KEBAB_SLUG filter below is what decides whether the
// capture becomes a library-card part. Hand-edited chat files with
// traversal-shaped slugs (`[[../../etc/passwd]]`) therefore round-trip
// as plain text instead of forging a tool-output part (WR-07).
const WIKILINK_RE = /\[\[([^\]\n]+?)\]\]/g
const KEBAB_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// External-mention token: `> external: Title — Author — Reason`. The em-dash is
// U+2014 (same char emitted by the serializer). The token is INLINE — it may
// appear at the start of a line or in the middle of a sentence (see AI-SPEC
// §4, lines 611-620 canonical example). The reason stops at end-of-line or EOF.
const EXTERNAL_TOKEN_RE = />\s*external:\s*([^—\n]+?)\s+—\s+([^—\n]+?)\s+—\s+([^\n]+?)\s*(?=\n|$)/g

interface HeadingMatch {
  role: 'user' | 'assistant'
  bodyStart: number
  bodyEnd: number
}

function splitSections(markdown: string): HeadingMatch[] {
  const matches: Array<{ role: 'user' | 'assistant'; headingEnd: number }> = []
  HEADING_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = HEADING_RE.exec(markdown)) !== null) {
    const speaker = m[1]
    const role = ROLE_FOR_SPEAKER[speaker]
    if (!role) continue
    matches.push({ role, headingEnd: m.index + m[0].length })
  }

  const sections: HeadingMatch[] = []
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].headingEnd
    const end = i + 1 < matches.length ? matches[i + 1].headingEnd : markdown.length
    // End of this section's body = start of the next heading (or EOF).
    // We want the body to exclude the next heading line, so find the
    // actual body end: the last char before the next heading's `##` starts.
    let bodyEnd = end
    if (i + 1 < matches.length) {
      // matches[i+1].headingEnd is AFTER the heading; we need to back up
      // to before that heading. Reconstruct by searching backwards for '##'.
      const nextHeadingStart = markdown.lastIndexOf('##', matches[i + 1].headingEnd - 1)
      if (nextHeadingStart > start) {
        bodyEnd = nextHeadingStart
      }
    }
    sections.push({ role: matches[i].role, bodyStart: start, bodyEnd })
  }
  return sections
}

interface Token {
  start: number
  end: number
  part: LibrarianMessagePart
}

function tokenizeBody(body: string): LibrarianMessagePart[] {
  const tokens: Token[] = []

  WIKILINK_RE.lastIndex = 0
  let wm: RegExpExecArray | null
  while ((wm = WIKILINK_RE.exec(body)) !== null) {
    const candidate = wm[1].trim()
    // WR-07: only KEBAB-shaped captures become library-card parts.
    // Anything else (traversal, punctuation, Unicode) remains in the
    // text flow — the tokenizer leaves it untouched and the stretch of
    // body between tokens renders as plain text in the assembled part
    // list. Matches the client-side D-14 layered guardrail.
    if (!KEBAB_SLUG.test(candidate)) continue
    tokens.push({
      start: wm.index,
      end: wm.index + wm[0].length,
      part: {
        type: 'tool-render_library_book_card',
        state: 'output-available',
        output: { slug: candidate },
      },
    })
  }

  EXTERNAL_TOKEN_RE.lastIndex = 0
  let em: RegExpExecArray | null
  while ((em = EXTERNAL_TOKEN_RE.exec(body)) !== null) {
    tokens.push({
      start: em.index,
      end: em.index + em[0].length,
      part: {
        type: 'tool-render_external_book_mention',
        state: 'output-available',
        output: {
          title: em[1].trim(),
          author: em[2].trim(),
          reason: em[3].trim(),
        },
      },
    })
  }

  // Emit parts in document order; interleave text fragments between tokens.
  tokens.sort((a, b) => a.start - b.start)
  const parts: LibrarianMessagePart[] = []
  let cursor = 0
  for (const tok of tokens) {
    if (tok.start > cursor) {
      const text = body.slice(cursor, tok.start).trim()
      if (text) parts.push({ type: 'text', text })
    }
    parts.push(tok.part)
    cursor = tok.end
  }
  if (cursor < body.length) {
    const text = body.slice(cursor).trim()
    if (text) parts.push({ type: 'text', text })
  }
  return parts
}

export function parseTranscript(markdown: string): LibrarianMessage[] {
  const sections = splitSections(markdown)
  const messages: LibrarianMessage[] = []
  for (let i = 0; i < sections.length; i++) {
    const { role, bodyStart, bodyEnd } = sections[i]
    const body = markdown.slice(bodyStart, bodyEnd)
    const parts = tokenizeBody(body)
    messages.push({
      id: `msg-${i}`,
      role,
      parts,
      // metadata intentionally omitted: round-trip does not preserve createdAt.
    })
  }
  return messages
}
