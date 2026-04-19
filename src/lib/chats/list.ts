import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { SAFE_MATTER_OPTIONS } from '@/lib/books/library-service'
import { ChatFrontmatterSchema, type ChatSummary } from './schema'
import { getChatsDir } from './store'

/**
 * Sidebar-facing chat entry. Extends the pure frontmatter summary with a
 * `content` excerpt so the client-side search input can match on both title
 * and conversation body. Capped at 4000 chars to keep the sidebar payload
 * bounded even when a conversation grows long.
 */
export interface ChatListEntry extends ChatSummary {
  content: string
}

const MAX_CONTENT_CHARS = 4000

/**
 * Lists all persisted conversations as frontmatter summaries plus a trimmed
 * body excerpt.
 *
 * Sorted by `updated_at` DESC so the sidebar (D-10) shows the most recent
 * chat first. `localeCompare` on ISO strings sorts lexicographically, which
 * is chronologically correct for ISO-8601.
 *
 * Malformed or unreadable files are skipped with `console.warn` — same
 * contract as `listBooks()` in `library-service.ts`. Returns `[]` when the
 * chats directory is missing.
 *
 * Uses `SAFE_MATTER_OPTIONS` (CVE-2025-65108 mitigation) on every parse.
 */
export async function listChats(): Promise<ChatListEntry[]> {
  const dir = getChatsDir()
  let files: string[]
  try {
    files = await fs.readdir(dir)
  } catch {
    return []
  }

  const items: ChatListEntry[] = []
  for (const file of files.filter((f) => f.endsWith('.md'))) {
    const filepath = path.join(dir, file)
    try {
      const raw = await fs.readFile(filepath, 'utf-8')
      const { data, content } = matter(raw, SAFE_MATTER_OPTIONS)
      const normalized = {
        ...data,
        started_at:
          data?.started_at instanceof Date
            ? data.started_at.toISOString()
            : data?.started_at,
        updated_at:
          data?.updated_at instanceof Date
            ? data.updated_at.toISOString()
            : data?.updated_at,
      }
      const parsed = ChatFrontmatterSchema.safeParse(normalized)
      if (parsed.success) {
        const trimmed = (content ?? '').slice(0, MAX_CONTENT_CHARS)
        items.push({ ...parsed.data, content: trimmed })
      } else {
        console.warn(
          '[ChatsList] Invalid frontmatter in',
          file,
          parsed.error.flatten()
        )
      }
    } catch (err) {
      console.warn(
        '[ChatsList] Error parsing',
        file,
        err instanceof Error ? err.message : err
      )
    }
  }

  return items.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}
