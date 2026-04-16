import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { BookSchema, type Book, type BookStatus } from './schema'
import { generateSlug, resolveSlugCollision } from './slug'

// CVE-2025-65108 mitigation: disable JavaScript engine in gray-matter.
// CRITICAL: The key MUST be 'javascript' (not 'js'). Using 'js' is the
// bug that caused CVE-2025-65108 -- the override is silently ignored.
export const SAFE_MATTER_OPTIONS: matter.GrayMatterOption<string, any> = {
  engines: {
    javascript: () => {
      throw new Error(
        'JavaScript front-matter engine is disabled for security reasons.'
      )
    },
  },
}

export function getLibraryDir(): string {
  return path.resolve(
    process.cwd(),
    process.env.LIBRARY_DIR ?? '/data/books'
  )
}

export async function listBooks(): Promise<Book[]> {
  const libraryDir = getLibraryDir()
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
      const result = BookSchema.safeParse({
        ...data,
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

export async function getBook(slug: string): Promise<Book | null> {
  const libraryDir = getLibraryDir()
  const filename = slug.endsWith('.md') ? slug : `${slug}.md`
  const filepath = path.join(libraryDir, filename)
  try {
    const raw = await fs.readFile(filepath, 'utf-8')
    const { data, content } = matter(raw, SAFE_MATTER_OPTIONS)
    const result = BookSchema.safeParse({
      ...data,
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
  author: string
  isbn?: string
  synopsis?: string
  cover?: string
  genre?: string
  year?: number
  status: BookStatus
  rating?: number
  notes?: string
}

export async function writeBook(input: WriteBookInput): Promise<{ slug: string }> {
  const dir = getLibraryDir()
  const baseSlug = generateSlug(input.title)
  const slug = await resolveSlugCollision(baseSlug)
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
  updates: Partial<WriteBookInput>
): Promise<void> {
  const dir = getLibraryDir()
  const filepath = path.join(dir, `${slug}.md`)

  const raw = await fs.readFile(filepath, 'utf-8')
  const { data, content } = matter(raw, SAFE_MATTER_OPTIONS)

  const { notes, ...frontmatterUpdates } = updates
  const newData = { ...data, ...frontmatterUpdates }
  const newContent = notes !== undefined ? notes : content

  const output = matter.stringify(newContent, newData)
  await fs.writeFile(filepath, output, 'utf-8')
}

export async function deleteBook(slug: string): Promise<void> {
  const dir = getLibraryDir()
  const filepath = path.join(dir, `${slug}.md`)
  await fs.unlink(filepath)
}
