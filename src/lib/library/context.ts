import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { SAFE_MATTER_OPTIONS, getLibraryDir } from '@/lib/books/library-service'

/**
 * Reads every `.md` file in `data/books` (or `process.env.LIBRARY_DIR`), parses its
 * frontmatter with the CVE-2025-65108 mitigation reused from `library-service.ts`,
 * and produces a single string used as the `<LIBRARY>` block in the system prompt.
 *
 * The output is lexically sorted so the prefix stays stable across requests — this
 * is a requirement for Anthropic prompt caching (see AI-SPEC §4, lines 466-495 and 641).
 *
 * Malformed files are skipped with `console.warn` (never throws) — same contract as
 * `listBooks()` in `library-service.ts`.
 */
export async function loadLibraryContext(): Promise<string> {
  const dir = getLibraryDir()
  let files: string[]
  try {
    files = await fs.readdir(dir)
  } catch {
    console.warn('[LibraryContext] Directory not found:', dir)
    return ''
  }

  const mdFiles = files.filter((f) => f.endsWith('.md'))
  const entries: string[] = []

  for (const file of mdFiles) {
    try {
      const raw = await fs.readFile(path.join(dir, file), 'utf-8')
      const { data, content } = matter(raw, SAFE_MATTER_OPTIONS)
      const slug = file.replace(/\.md$/, '')
      const notesTrim = (content ?? '').trim()
      const parts: (string | null)[] = [
        `### ${data.title} — ${data.author}`,
        `slug: ${slug}`,
        `status: ${data.status}`,
        data.rating != null ? `rating: ${data.rating}/5` : null,
        typeof data.genre === 'string' && data.genre.trim()
          ? `genre: ${data.genre}`
          : null,
        notesTrim ? `notes: ${notesTrim.slice(0, 400)}` : null,
      ]
      entries.push(parts.filter((p): p is string => p !== null).join('\n'))
    } catch (err) {
      console.warn(
        '[LibraryContext] Error parsing',
        file,
        err instanceof Error ? err.message : err
      )
    }
  }

  // Stable sort: keeps the prompt-cache prefix deterministic.
  return entries.sort().join('\n\n')
}
