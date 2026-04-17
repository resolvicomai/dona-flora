import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { SAFE_MATTER_OPTIONS } from '@/lib/books/library-service'
import { ChatFrontmatterSchema, type ChatSummary } from './schema'
import { getChatsDir } from './store'

/**
 * Lists all persisted conversations as frontmatter-only summaries.
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
export async function listChats(): Promise<ChatSummary[]> {
  const dir = getChatsDir()
  let files: string[]
  try {
    files = await fs.readdir(dir)
  } catch {
    return []
  }

  const items: ChatSummary[] = []
  for (const file of files.filter((f) => f.endsWith('.md'))) {
    const filepath = path.join(dir, file)
    try {
      const raw = await fs.readFile(filepath, 'utf-8')
      const { data } = matter(raw, SAFE_MATTER_OPTIONS)
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
        items.push(parsed.data)
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
