import { z } from 'zod'

export const BookStatusEnum = z.enum([
  'quero-ler',
  'lendo',
  'lido',
  'quero-reler',
  'abandonado',
])

export const BookSchema = z.object({
  title: z.string(),
  author: z.string(),
  isbn: z.string().optional(),
  synopsis: z.string().optional(),
  cover: z.string().optional(),
  genre: z.string().optional(),
  year: z.coerce.number().int().optional(),
  language: z.string().min(2).max(32).optional(),
  status: BookStatusEnum,
  rating: z.coerce.number().int().min(1).max(5).optional(),
  /**
   * ISO date string "YYYY-MM-DD". Set by writeBook() on creation.
   * If missing or unparseable when listBooks() reads a file, lazy-backfilled
   * from fs.stat().mtime. YAML Date objects (unquoted `added_at: 2026-04-01`)
   * are coerced to strings before validation. Never rewrites the file.
   */
  added_at: z.string(),
  _notes: z.string().default(''),
  _filename: z.string().optional(),
})

export type Book = z.infer<typeof BookSchema>
export type BookStatus = z.infer<typeof BookStatusEnum>
