import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import type { StorageContext } from '@/lib/storage/context'
import { getDataSubdirectory } from '@/lib/storage/data-root'
import { BookSchema, type Book, type BookStatus } from './schema'
import { splitLegacyISBN } from './isbn'
import { generateSlug, resolveSlugCollision } from './slug'

// CVE-2025-65108 mitigation: disable JavaScript engine in gray-matter.
// CRITICAL: The key MUST be 'javascript' (not 'js'). Using 'js' is the
// bug that caused CVE-2025-65108 -- the override is silently ignored.
export const SAFE_MATTER_OPTIONS = {
  engines: {
    javascript: () => {
      throw new Error(
        'JavaScript front-matter engine is disabled for security reasons.'
      )
    },
  },
}

export function getLibraryDir(context?: StorageContext): string {
  if (context) {
    return context.booksDir
  }

  return getDataSubdirectory('books', process.env.LIBRARY_DIR)
}

async function normalizeBookDataForParse(
  data: Record<string, unknown>,
  filepath?: string,
) {
  const normalized = { ...data }

  for (const dateKey of ['added_at', 'started_at', 'finished_at']) {
    if (normalized[dateKey] instanceof Date) {
      normalized[dateKey] = (normalized[dateKey] as Date)
        .toISOString()
        .split('T')[0]
    }
  }

  if (
    (!normalized.added_at ||
      typeof normalized.added_at !== 'string' ||
      Number.isNaN(Date.parse(normalized.added_at))) &&
    filepath
  ) {
    const stat = await fs.stat(filepath)
    normalized.added_at = stat.mtime.toISOString().split('T')[0]
  }

  const isbn = splitLegacyISBN({
    isbn: typeof normalized.isbn === 'string' ? normalized.isbn : undefined,
    isbn_10:
      typeof normalized.isbn_10 === 'string' ? normalized.isbn_10 : undefined,
    isbn_13:
      typeof normalized.isbn_13 === 'string' ? normalized.isbn_13 : undefined,
  })

  return {
    ...normalized,
    ...isbn,
  }
}

export async function listBooks(context?: StorageContext): Promise<Book[]> {
  const libraryDir = getLibraryDir(context)
  let files: string[]
  try {
    files = await fs.readdir(libraryDir)
  } catch {
    console.warn(`[LibraryService] Directory not found: ${libraryDir}`)
    return []
  }

  const mdFiles = files.filter((f) => f.endsWith('.md'))
  const books: Book[] = []

  for (const filename of mdFiles) {
    const filepath = path.join(libraryDir, filename)
    const raw = await fs.readFile(filepath, 'utf-8')
    try {
      const { data, content } = matter(raw, SAFE_MATTER_OPTIONS)

      const normalizedData = await normalizeBookDataForParse(data, filepath)

      const result = BookSchema.safeParse({
        ...normalizedData,
        _notes: content.trim(),
        _filename: filename,
      })
      if (result.success) {
        books.push(result.data)
      } else {
        console.warn(
          `[LibraryService] Invalid frontmatter in ${filename}:`,
          result.error.flatten()
        )
      }
    } catch (err) {
      console.warn(
        `[LibraryService] Error parsing ${filename}:`,
        err instanceof Error ? err.message : err
      )
    }
  }

  return books
}

export async function getBook(
  slug: string,
  context?: StorageContext,
): Promise<Book | null> {
  const libraryDir = getLibraryDir(context)
  const filename = slug.endsWith('.md') ? slug : `${slug}.md`
  const filepath = path.join(libraryDir, filename)
  try {
    const raw = await fs.readFile(filepath, 'utf-8')
    const { data, content } = matter(raw, SAFE_MATTER_OPTIONS)
    const normalizedData = await normalizeBookDataForParse(data, filepath)
    const result = BookSchema.safeParse({
      ...normalizedData,
      _notes: content.trim(),
      _filename: filename,
    })
    return result.success ? result.data : null
  } catch {
    return null
  }
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
}

export async function deleteBook(
  slug: string,
  context?: StorageContext,
): Promise<void> {
  const dir = getLibraryDir(context)
  const filepath = path.join(dir, `${slug}.md`)
  await fs.unlink(filepath)
}
