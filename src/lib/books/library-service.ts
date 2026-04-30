import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import type { StorageContext } from '@/lib/storage/context'
import {
  SAFE_MATTER_OPTIONS,
  getLibraryDir,
  invalidateBookCache,
  loadLibraryBook,
  loadLibrarySnapshot,
} from '@/lib/library/snapshot'
import { type Book, type BookStatus } from './schema'
import { generateSlug, resolveSlugCollision } from './slug'
export { SAFE_MATTER_OPTIONS, getLibraryDir, invalidateBookCache } from '@/lib/library/snapshot'

export async function listBooks(context?: StorageContext): Promise<Book[]> {
  const snapshot = await loadLibrarySnapshot(context)
  for (const diagnostic of snapshot.diagnostics) {
    const target = diagnostic.filename ?? diagnostic.filepath ?? 'acervo'
    console.warn(`[LibraryService] ${diagnostic.kind} in ${target}:`, diagnostic.message)
  }
  return snapshot.books
}

export async function getBook(slug: string, context?: StorageContext): Promise<Book | null> {
  return loadLibraryBook(slug, context)
}

export interface WriteBookInput {
  title: string
  subtitle?: string
  author: string | string[]
  translator?: string
  isbn?: string
  isbn_10?: string
  isbn_13?: string
  publisher?: string
  synopsis?: string
  synopsis_source?: string
  cover?: string
  genre?: string
  year?: number
  language?: string
  series?: string
  series_index?: number
  status: BookStatus
  priority?: number
  started_at?: string
  finished_at?: string
  progress?: number
  current_page?: number
  rating?: number
  tags?: string[]
  notes?: string
}

export type BookUpdateInput = {
  [Key in keyof WriteBookInput]?: WriteBookInput[Key] | null
} & Record<string, unknown>

export async function writeBook(
  input: WriteBookInput,
  context?: StorageContext,
): Promise<{ slug: string }> {
  const dir = getLibraryDir(context)
  const baseSlug = generateSlug(input.title)
  const slug = await resolveSlugCollision(baseSlug, undefined, dir)
  const filepath = path.join(dir, `${slug}.md`)

  const { notes, ...rest } = input
  const frontmatter: Record<string, unknown> = {
    ...rest,
    added_at: new Date().toISOString().split('T')[0],
  }
  const content = matter.stringify(notes ?? '', frontmatter)
  await fs.writeFile(filepath, content, 'utf-8')
  invalidateBookCache(context)

  return { slug }
}

export async function updateBook(
  slug: string,
  updates: BookUpdateInput,
  context?: StorageContext,
): Promise<void> {
  const dir = getLibraryDir(context)
  const filepath = path.join(dir, `${slug}.md`)

  const raw = await fs.readFile(filepath, 'utf-8')
  const { data, content } = matter(raw, SAFE_MATTER_OPTIONS)

  const { notes, ...frontmatterUpdates } = updates
  const newData = { ...data }
  for (const [key, value] of Object.entries(frontmatterUpdates)) {
    if (value === null) {
      delete newData[key]
      continue
    }
    newData[key] = value
  }
  const newContent = typeof notes === 'string' ? notes : content

  const output = matter.stringify(newContent, newData)
  await fs.writeFile(filepath, output, 'utf-8')
  invalidateBookCache(context)
}

export async function deleteBook(slug: string, context?: StorageContext): Promise<void> {
  const dir = getLibraryDir(context)
  const filepath = path.join(dir, `${slug}.md`)
  await fs.unlink(filepath)
  invalidateBookCache(context)
}
