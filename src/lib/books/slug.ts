import slugify from 'slugify'
import fs from 'fs/promises'
import path from 'path'
import { getLibraryDir } from './library-service'

/**
 * Generates a lowercase ASCII slug from any UTF-8 title.
 * Uses strict mode to strip all non-alphanumeric characters,
 * which prevents path traversal by design (no '..', '/', '\' can survive).
 * locale:'pt' handles Portuguese accent transliteration.
 */
export function generateSlug(title: string): string {
  return slugify(title, {
    lower: true,
    strict: true,
    locale: 'pt',
  })
}

/**
 * Resolves slug collisions by appending -2, -3, etc. when a slug is taken.
 * Returns the base slug if no collision, or the next available slug.
 *
 * Two modes:
 *
 *  1. **Disk mode (default):** When no `existing` set is passed, checks
 *     `getLibraryDir()` for `.md` files. Used by `writeBook` (books).
 *  2. **In-memory mode:** When `existing` is a `Set<string>` (or `string[]`)
 *     of already-taken slugs, resolves entirely in memory without touching
 *     the filesystem. Used by trails (Phase 4, Plan 02) which persist to
 *     `data/trails/` — a different directory from books.
 *
 * Both modes return the same shape (`Promise<string>`) so the API is
 * uniform. The book flow continues to work untouched (no call-site changes
 * needed — default behavior is preserved).
 */
export async function resolveSlugCollision(
  baseSlug: string,
  existing?: Set<string> | string[],
  directory?: string,
): Promise<string> {
  if (existing !== undefined) {
    const taken = existing instanceof Set ? existing : new Set(existing)
    let slug = baseSlug
    let counter = 1
    while (taken.has(slug)) {
      counter++
      slug = `${baseSlug}-${counter}`
    }
    return slug
  }

  const dir = directory ?? getLibraryDir()
  let slug = baseSlug
  let counter = 1
  while (true) {
    try {
      await fs.access(path.join(dir, `${slug}.md`))
      // File exists — try next counter
      counter++
      slug = `${baseSlug}-${counter}`
    } catch {
      // File does not exist — this slug is available
      return slug
    }
  }
}
