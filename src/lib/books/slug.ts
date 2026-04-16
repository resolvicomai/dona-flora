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
 * Resolves slug collisions by appending -2, -3, etc. when a file already exists.
 * Returns the base slug if no collision, or the next available slug.
 */
export async function resolveSlugCollision(baseSlug: string): Promise<string> {
  const dir = getLibraryDir()
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
