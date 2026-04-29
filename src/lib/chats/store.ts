import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import type { StorageContext } from '@/lib/storage/context'
import { getDataSubdirectory } from '@/lib/storage/data-root'
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

export function getChatsDir(context?: StorageContext): string {
  if (context) {
    return context.chatsDir
  }

  return getDataSubdirectory('chats', process.env.CHATS_DIR)
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
  storageContext?: StorageContext
}

export interface UpdateChatMetadataInput {
  chatId: string
  title?: string
  pinned?: boolean
  storageContext?: StorageContext
}

/**
 * Persists a conversation as `data/chats/{chatId}.md` (Obsidian-editable).
 *
 * On re-save of an existing conversation, `started_at` from the on-disk file is
 * preserved; `updated_at` always advances to the current wall-clock time.
 */
export async function saveChat({
  chatId,
  messages,
  storageContext,
}: SaveChatInput): Promise<void> {
  const dir = getChatsDir(storageContext)
  await fs.mkdir(dir, { recursive: true })
  const filepath = path.join(dir, `${chatId}.md`)

  // Preserve existing started_at if the file already exists.
  let existing: Partial<ChatFrontmatter> = {}
  try {
    const raw = await fs.readFile(filepath, 'utf-8')
    const { data } = matter(raw, SAFE_MATTER_OPTIONS)
    const normalized = normalizeChatFrontmatter(data)
    const parsed = ChatFrontmatterSchema.safeParse(normalized)
    if (parsed.success) {
      existing = parsed.data
    } else {
      existing.started_at = normalizeIso(data?.started_at)
    }
  } catch {
    // new conversation — not an error
  }

  const nowIso = new Date().toISOString()
  const firstMessageCreatedAt = normalizeIso(messages[0]?.metadata?.createdAt)
  const derivedTitle = deriveTitle(messages)
  const title =
    existing.title_locked && existing.title
      ? existing.title
      : derivedTitle

  const fm: ChatFrontmatter = {
    id: chatId,
    title,
    started_at: existing.started_at ?? firstMessageCreatedAt ?? nowIso,
    updated_at: nowIso,
    book_refs: extractBookRefs(messages),
    pinned: existing.pinned ?? false,
    title_locked: existing.title_locked ?? false,
  }

  const body = serializeTranscript(messages)
  const file = matter.stringify(body, fm)
  await fs.writeFile(filepath, file, 'utf-8')
}

/**
 * Updates sidebar-facing chat metadata while preserving the Markdown transcript.
 *
 * A renamed title sets `title_locked` so future `saveChat()` calls do not
 * overwrite the user's label with the first prompt again.
 */
export async function updateChatMetadata({
  chatId,
  title,
  pinned,
  storageContext,
}: UpdateChatMetadataInput): Promise<ChatFrontmatter | null> {
  const filepath = path.join(getChatsDir(storageContext), `${chatId}.md`)
  let raw: string
  try {
    raw = await fs.readFile(filepath, 'utf-8')
  } catch {
    return null
  }

  const parsedFile = matter(raw, SAFE_MATTER_OPTIONS)
  const normalized = normalizeChatFrontmatter(parsedFile.data)
  const parsed = ChatFrontmatterSchema.safeParse(normalized)
  if (!parsed.success) {
    return null
  }

  const nowIso = new Date().toISOString()
  const next: ChatFrontmatter = {
    ...parsed.data,
    ...(title !== undefined
      ? { title: title.trim(), title_locked: true }
      : {}),
    ...(pinned !== undefined ? { pinned } : {}),
    updated_at: nowIso,
  }

  const file = matter.stringify(parsedFile.content, next)
  await fs.writeFile(filepath, file, 'utf-8')
  return next
}

/**
 * Loads a conversation from disk. Returns `null` when the file is missing or
 * the frontmatter fails `ChatFrontmatterSchema` validation.
 *
 * On schema-validation failure we warn but do not throw — the caller (a page
 * or API route) should treat this as a 404.
 */
export async function loadChat(
  chatId: string,
  storageContext?: StorageContext,
): Promise<LibrarianMessage[] | null> {
  const filepath = path.join(getChatsDir(storageContext), `${chatId}.md`)
  let raw: string
  try {
    raw = await fs.readFile(filepath, 'utf-8')
  } catch {
    return null
  }

  try {
    const { data, content } = matter(raw, SAFE_MATTER_OPTIONS)
    const normalized = normalizeChatFrontmatter(data)
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

function normalizeChatFrontmatter(data: Record<string, unknown>) {
  return {
    ...data,
    started_at: normalizeIso(data?.started_at),
    updated_at: normalizeIso(data?.updated_at),
    pinned: data?.pinned === true,
    title_locked: data?.title_locked === true,
  }
}

/**
 * Deletes `data/chats/{chatId}.md`. Returns true if the file was removed,
 * false if it did not exist. Any other fs error re-throws so the API route
 * can translate it into a 500.
 *
 * `chatId` MUST be validated at the API boundary with the same regex as
 * `saveChat` — this function trusts its input, matching the contract of
 * the rest of the store.
 */
export async function deleteChat(
  chatId: string,
  storageContext?: StorageContext,
): Promise<boolean> {
  const file = path.join(getChatsDir(storageContext), `${chatId}.md`)
  try {
    await fs.unlink(file)
    return true
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return false
    throw err
  }
}
