import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import type { StorageContext } from '@/lib/storage/context'
import { getDataSubdirectory } from '@/lib/storage/data-root'
import { generateSlug, resolveSlugCollision } from '@/lib/books/slug'
import { TrailFrontmatterSchema, type TrailFrontmatter } from './schema'

/**
 * Reading-trail persistence layer — writes `.md` files to `data/trails/{slug}.md`.
 *
 * Reuses `generateSlug` and `resolveSlugCollision` from `@/lib/books/slug`
 * (extended in Phase 4 Plan 02 to accept an in-memory `Set<string>` so trails
 * can resolve collisions against their OWN directory without touching the
 * books dir). The slug's `strict:true` option (Phase 2 decision) prevents
 * path traversal by construction — no '..', '/', or '\\' can survive.
 */

export function getTrailsDir(context?: StorageContext): string {
  if (context) {
    return context.trailsDir
  }

  return getDataSubdirectory('trails', process.env.TRAILS_DIR)
}

export interface SaveTrailInput {
  title: string
  goal?: string
  book_refs: string[]
  notes?: string
}

export interface SaveTrailResult {
  slug: string
}

/**
 * Writes a trail to `data/trails/{slug}.md`.
 *
 * Slug derivation:
 *  - `generateSlug(title)` produces a kebab-case ASCII slug.
 *  - If the title slugifies to empty (e.g. title is only punctuation), the
 *    base slug falls back to `'trilha'`.
 *  - Collisions are resolved against the existing `.md` files in the trails
 *    dir via `resolveSlugCollision(base, existingSet)` — returns `-2`, `-3`,
 *    etc. as needed.
 *
 * Validation: frontmatter passes through `TrailFrontmatterSchema.parse` before
 * write — throws on invalid input (empty `book_refs`, etc.). The caller (API
 * route in Plan 03) is responsible for converting the throw to a 400 response.
 */
export async function saveTrail(
  input: SaveTrailInput,
  context?: StorageContext,
): Promise<SaveTrailResult> {
  const dir = getTrailsDir(context)
  await fs.mkdir(dir, { recursive: true })

  let existing: string[] = []
  try {
    const files = await fs.readdir(dir)
    existing = files
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))
  } catch {
    // dir freshly created or unreadable — no collisions to resolve
  }

  const baseSlug = generateSlug(input.title) || 'trilha'
  const slug = await resolveSlugCollision(baseSlug, new Set(existing))

  const fm: TrailFrontmatter = TrailFrontmatterSchema.parse({
    title: input.title,
    goal: input.goal ?? '',
    created_at: new Date().toISOString(),
    book_refs: input.book_refs,
    notes: input.notes ?? '',
  })

  const file = matter.stringify(fm.notes, fm)
  await fs.writeFile(path.join(dir, `${slug}.md`), file, 'utf-8')

  return { slug }
}
