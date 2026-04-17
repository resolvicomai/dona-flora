import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { SAFE_MATTER_OPTIONS } from '@/lib/books/library-service'
import { ChatFrontmatterSchema, type ChatFrontmatter } from './schema'
import { serializeTranscript, parseTranscript } from './serialize'
import type { LibrarianMessage, LibrarianMessagePart } from './types'

/**
 * Chat persistence layer — writes `.md` files to `data/chats/{chatId}.md`.
 *
 * CVE-2025-65108 mitigation: every `matter()` call passes SAFE_MATTER_OPTIONS
 * (imported from library-service). Files in `data/chats/` are human-editable
 * (Obsidian / VS Code), same trust boundary as `data/books/`.
 *
 * Contract: `chatId` is TRUSTED — path traversal sanitization happens at the
 * API-route boundary in Plan 03 via Zod `.regex(/^[a-z0-9-]+$/i)`. This matches
 * the contract of `writeBook(slug)`, which also trusts its slug parameter.
 */

export function getChatsDir(): string {
  return path.resolve(process.cwd(), process.env.CHATS_DIR ?? 'data/chats')
}

/**
 * Derives a short conversation title from the first user message.
 * Returns 'Conversa sem título' when no user message is available or the
 * aggregated text is empty after trimming.
 */
function deriveTitle(messages: LibrarianMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user')
  if (!firstUser) return 'Conversa sem título'
  const text = firstUser.parts
    .filter((p): p is Extract<LibrarianMessagePart, { type: 'text' }> => p.type === 'text')
    .map((p) => p.text)
    .join(' ')
    .trim()
  if (!text) return 'Conversa sem título'
  return text.length > 60 ? text.slice(0, 60).trimEnd() + '…' : text
}

/**
 * Collects the slugs of every `tool-render_library_book_card` output in order,
 * deduped (first-seen wins). Used to populate frontmatter `book_refs` so the
 * sidebar (D-10) can display which library books a conversation touched.
 */
function extractBookRefs(messages: LibrarianMessage[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const m of messages) {
    for (const p of m.parts) {
      if (
        p.type === 'tool-render_library_book_card' &&
        p.state === 'output-available' &&
        p.output?.slug &&
        !seen.has(p.output.slug)
      ) {
        seen.add(p.output.slug)
        out.push(p.output.slug)
      }
    }
  }
  return out
}

/**
 * Normalizes YAML-coerced timestamp values back to ISO strings.
 * YAML (js-yaml) auto-parses unquoted ISO date-times into Date objects —
 * same idiom used by `library-service.ts` for `added_at`.
 */
function normalizeIso(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string' && value.length > 0) return value
  return undefined
}

export interface SaveChatInput {
  chatId: string
  messages: LibrarianMessage[]
}

/**
 * Persists a conversation as `data/chats/{chatId}.md` (Obsidian-editable).
 *
 * On re-save of an existing conversation, `started_at` from the on-disk file is
 * preserved; `updated_at` always advances to the current wall-clock time.
 */
export async function saveChat({ chatId, messages }: SaveChatInput): Promise<void> {
  const dir = getChatsDir()
  await fs.mkdir(dir, { recursive: true })
  const filepath = path.join(dir, `${chatId}.md`)

  // Preserve existing started_at if the file already exists.
  let existingStartedAt: string | undefined
  try {
    const raw = await fs.readFile(filepath, 'utf-8')
    const { data } = matter(raw, SAFE_MATTER_OPTIONS)
    existingStartedAt = normalizeIso(data?.started_at)
  } catch {
    // new conversation — not an error
  }

  const nowIso = new Date().toISOString()
  const firstMessageCreatedAt = normalizeIso(messages[0]?.metadata?.createdAt)

  const fm: ChatFrontmatter = {
    id: chatId,
    title: deriveTitle(messages),
    started_at: existingStartedAt ?? firstMessageCreatedAt ?? nowIso,
    updated_at: nowIso,
    book_refs: extractBookRefs(messages),
  }

  const body = serializeTranscript(messages)
  const file = matter.stringify(body, fm)
  await fs.writeFile(filepath, file, 'utf-8')
}

/**
 * Loads a conversation from disk. Returns `null` when the file is missing or
 * the frontmatter fails `ChatFrontmatterSchema` validation.
 *
 * On schema-validation failure we warn but do not throw — the caller (a page
 * or API route) should treat this as a 404.
 */
export async function loadChat(chatId: string): Promise<LibrarianMessage[] | null> {
  const filepath = path.join(getChatsDir(), `${chatId}.md`)
  let raw: string
  try {
    raw = await fs.readFile(filepath, 'utf-8')
  } catch {
    return null
  }

  try {
    const { data, content } = matter(raw, SAFE_MATTER_OPTIONS)
    const normalized = {
      ...data,
      started_at: normalizeIso(data?.started_at),
      updated_at: normalizeIso(data?.updated_at),
    }
    const parsed = ChatFrontmatterSchema.safeParse(normalized)
    if (!parsed.success) {
      console.warn(
        '[ChatsStore] Invalid frontmatter in',
        chatId,
        parsed.error.flatten()
      )
      return null
    }
    return parseTranscript(content)
  } catch (err) {
    console.warn(
      '[ChatsStore] Error parsing',
      chatId,
      err instanceof Error ? err.message : err
    )
    return null
  }
}
