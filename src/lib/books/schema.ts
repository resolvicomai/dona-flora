import { z } from 'zod'

export const BookStatusEnum = z.enum(['quero-ler', 'lendo', 'lido', 'quero-reler', 'abandonado'])

function isRealDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  )
}

export const DateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine(isRealDateOnly, 'Use uma data real em YYYY-MM-DD')

export const ISBN10Schema = z.preprocess(
  (value) => (typeof value === 'string' ? value.replace(/[-\s]/g, '').toUpperCase() : value),
  z.string().regex(/^\d{9}[\dX]$/),
)

export const ISBN13Schema = z.preprocess(
  (value) => (typeof value === 'string' ? value.replace(/[-\s]/g, '') : value),
  z.string().regex(/^\d{13}$/),
)

export const BookAuthorSchema = z
  .union([z.string(), z.array(z.string())])
  .transform((value) =>
    (Array.isArray(value) ? value : [value]).map((author) => author.trim()).filter(Boolean),
  )

export const BookSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  author: BookAuthorSchema,
  translator: z.string().optional(),
  isbn: z.string().optional(),
  isbn_10: ISBN10Schema.optional(),
  isbn_13: ISBN13Schema.optional(),
  publisher: z.string().optional(),
  synopsis: z.string().optional(),
  synopsis_source: z.string().optional(),
  cover: z.string().url().optional(),
  genre: z.string().optional(),
  year: z.coerce.number().int().optional(),
  language: z.string().min(2).max(32).optional(),
  series: z.string().optional(),
  series_index: z.coerce.number().optional(),
  status: BookStatusEnum,
  priority: z.coerce.number().int().min(1).max(5).optional(),
  started_at: DateOnlySchema.optional(),
  finished_at: DateOnlySchema.optional(),
  progress: z.coerce.number().int().min(0).max(100).optional(),
  current_page: z.coerce.number().int().nonnegative().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  /**
   * ISO date string "YYYY-MM-DD". Set by writeBook() on creation.
   * If missing or unparseable when listBooks() reads a file, lazy-backfilled
   * from fs.stat().mtime. YAML Date objects (unquoted `added_at: 2026-04-01`)
   * are coerced to strings before validation. Never rewrites the file.
   */
  added_at: DateOnlySchema,
  _notes: z.string().default(''),
  _filename: z.string().optional(),
})

export type Book = z.infer<typeof BookSchema>
export type BookStatus = z.infer<typeof BookStatusEnum>
