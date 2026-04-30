import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { getDataSubdirectory } from '@/lib/storage/data-root'
import type { StorageContext } from '@/lib/storage/context'
import { splitLegacyISBN } from '@/lib/books/isbn'
import { BookSchema, type Book } from '@/lib/books/schema'

// CVE-2025-65108 mitigation: disable JavaScript engine in gray-matter.
// CRITICAL: the key must be 'javascript'; using 'js' is ignored by gray-matter.
export const SAFE_MATTER_OPTIONS = {
  engines: {
    javascript: () => {
      throw new Error('JavaScript front-matter engine is disabled for security reasons.')
    },
  },
}

export type LibraryDiagnosticKind =
  | 'directory-missing'
  | 'invalid-frontmatter'
  | 'parse-error'
  | 'read-error'

export interface LibraryDiagnostic {
  filename?: string
  filepath?: string
  kind: LibraryDiagnosticKind
  message: string
}

export interface LibrarySnapshot {
  books: Book[]
  diagnostics: LibraryDiagnostic[]
}

interface BookFileCacheEntry {
  book: Book | null
  diagnostic: LibraryDiagnostic | null
  mtimeMs: number
  size: number
}

const bookFileCache = new Map<string, BookFileCacheEntry>()

export function getLibraryDir(context?: StorageContext): string {
  if (context) {
    return context.booksDir
  }

  return getDataSubdirectory('books', process.env.LIBRARY_DIR)
}

export function invalidateBookCache(context?: StorageContext): void {
  if (!context) {
    bookFileCache.clear()
    return
  }

  const prefix = `${getLibraryDir(context)}${path.sep}`
  for (const filepath of bookFileCache.keys()) {
    if (filepath.startsWith(prefix)) {
      bookFileCache.delete(filepath)
    }
  }
}

async function normalizeBookDataForParse(data: Record<string, unknown>, filepath?: string) {
  const normalized = { ...data }

  for (const dateKey of ['added_at', 'started_at', 'finished_at']) {
    if (normalized[dateKey] instanceof Date) {
      normalized[dateKey] = (normalized[dateKey] as Date).toISOString().split('T')[0]
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
    isbn_10: typeof normalized.isbn_10 === 'string' ? normalized.isbn_10 : undefined,
    isbn_13: typeof normalized.isbn_13 === 'string' ? normalized.isbn_13 : undefined,
  })

  return {
    ...normalized,
    ...isbn,
  }
}

async function parseBookFile(
  filepath: string,
  filename: string,
): Promise<{ book: Book | null; diagnostic: LibraryDiagnostic | null }> {
  try {
    const raw = await fs.readFile(filepath, 'utf-8')
    const { data, content } = matter(raw, SAFE_MATTER_OPTIONS)
    const normalizedData = await normalizeBookDataForParse(data, filepath)
    const result = BookSchema.safeParse({
      ...normalizedData,
      _filename: filename,
      _notes: content.trim(),
    })

    if (result.success) {
      return { book: result.data, diagnostic: null }
    }

    return {
      book: null,
      diagnostic: {
        filename,
        filepath,
        kind: 'invalid-frontmatter',
        message: result.error.message,
      },
    }
  } catch (err) {
    return {
      book: null,
      diagnostic: {
        filename,
        filepath,
        kind: 'parse-error',
        message: err instanceof Error ? err.message : 'Erro ao ler Markdown.',
      },
    }
  }
}

async function getCachedBook(filepath: string, filename: string) {
  const stat = await fs.stat(filepath)
  const cached = bookFileCache.get(filepath)
  if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
    return cached
  }

  const parsed = await parseBookFile(filepath, filename)
  const entry = {
    ...parsed,
    mtimeMs: stat.mtimeMs,
    size: stat.size,
  }
  bookFileCache.set(filepath, entry)
  return entry
}

export async function loadLibrarySnapshot(context?: StorageContext): Promise<LibrarySnapshot> {
  const libraryDir = getLibraryDir(context)
  let files: string[]

  try {
    files = await fs.readdir(libraryDir)
  } catch (err) {
    return {
      books: [],
      diagnostics: [
        {
          filepath: libraryDir,
          kind: 'directory-missing',
          message: err instanceof Error ? err.message : 'Pasta do acervo nao encontrada.',
        },
      ],
    }
  }

  const books: Book[] = []
  const diagnostics: LibraryDiagnostic[] = []
  const seen = new Set<string>()

  for (const filename of files.filter((file) => file.endsWith('.md'))) {
    const filepath = path.join(libraryDir, filename)
    seen.add(filepath)

    try {
      const result = await getCachedBook(filepath, filename)
      if (result.book) {
        books.push(result.book)
      }
      if (result.diagnostic) {
        diagnostics.push(result.diagnostic)
      }
    } catch (err) {
      diagnostics.push({
        filename,
        filepath,
        kind: 'read-error',
        message: err instanceof Error ? err.message : 'Erro ao acessar arquivo do acervo.',
      })
    }
  }

  const prefix = `${libraryDir}${path.sep}`
  for (const cachedPath of bookFileCache.keys()) {
    if (cachedPath.startsWith(prefix) && !seen.has(cachedPath)) {
      bookFileCache.delete(cachedPath)
    }
  }

  return { books, diagnostics }
}

export async function loadLibraryBook(
  slug: string,
  context?: StorageContext,
): Promise<Book | null> {
  const libraryDir = getLibraryDir(context)
  const filename = slug.endsWith('.md') ? slug : `${slug}.md`
  const filepath = path.join(libraryDir, filename)

  try {
    const result = await getCachedBook(filepath, filename)
    return result.book
  } catch {
    return null
  }
}
