import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import type { StorageContext } from '@/lib/storage/context'
import { SAFE_MATTER_OPTIONS } from '@/lib/books/library-service'
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

export type TrailRecord = TrailFrontmatter & {
  slug: string
  _filename: string
  _notes: string
}

const TRAIL_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

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

function normalizeTrailDataForParse(data: Record<string, unknown>) {
  const normalized = { ...data }

  if (normalized.created_at instanceof Date) {
    normalized.created_at = normalized.created_at.toISOString()
  }

  return normalized
}

async function readTrailFile(
  dir: string,
  filename: string,
): Promise<TrailRecord | null> {
  if (!filename.endsWith('.md')) return null

  const filepath = path.join(dir, filename)
  const raw = await fs.readFile(filepath, 'utf-8')
  const { data, content } = matter(raw, SAFE_MATTER_OPTIONS)
  const parsed = TrailFrontmatterSchema.parse(
    normalizeTrailDataForParse(data as Record<string, unknown>),
  )

  return {
    ...parsed,
    slug: filename.replace(/\.md$/, ''),
    _filename: filename,
    _notes: content,
  }
}

export async function listTrails(
  context?: StorageContext,
): Promise<TrailRecord[]> {
  const dir = getTrailsDir(context)

  try {
    await fs.mkdir(dir, { recursive: true })
    const files = await fs.readdir(dir)
    const trails = await Promise.all(
      files
        .filter((file) => file.endsWith('.md'))
        .map((file) => readTrailFile(dir, file).catch(() => null)),
    )

    return trails
      .filter((trail): trail is TrailRecord => trail !== null)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  } catch {
    return []
  }
}

export async function getTrail(
  slug: string,
  context?: StorageContext,
): Promise<TrailRecord | null> {
  if (!TRAIL_SLUG_RE.test(slug)) {
    return null
  }

  const dir = getTrailsDir(context)

  try {
    return await readTrailFile(dir, `${slug}.md`)
  } catch {
    return null
  }
}

export interface UpdateTrailInput {
  slug: string
  title?: string
  goal?: string
  notes?: string
  context?: StorageContext
}

export async function updateTrail({
  context,
  goal,
  notes,
  slug,
  title,
}: UpdateTrailInput): Promise<TrailRecord | null> {
  if (!TRAIL_SLUG_RE.test(slug)) {
    return null
  }

  const current = await getTrail(slug, context)
  if (!current) {
    return null
  }

  const dir = getTrailsDir(context)
  const next: TrailFrontmatter = TrailFrontmatterSchema.parse({
    title: title ?? current.title,
    goal: goal ?? current.goal,
    created_at: current.created_at,
    book_refs: current.book_refs,
    notes: notes ?? current.notes,
  })
  const body = notes ?? current._notes
  const file = matter.stringify(body, next)
  await fs.writeFile(path.join(dir, `${slug}.md`), file, 'utf-8')

  return {
    ...next,
    slug,
    _filename: `${slug}.md`,
    _notes: body,
  }
}

export async function deleteTrail(
  slug: string,
  context?: StorageContext,
): Promise<boolean> {
  if (!TRAIL_SLUG_RE.test(slug)) {
    return false
  }

  const dir = getTrailsDir(context)

  try {
    await fs.rm(path.join(dir, `${slug}.md`))
    return true
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
      return false
    }
    throw err
  }
}
