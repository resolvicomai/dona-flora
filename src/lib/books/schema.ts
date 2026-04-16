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
  status: BookStatusEnum,
  rating: z.coerce.number().int().min(1).max(5).optional(),
  added_at: z.string(),
  _notes: z.string().default(''),
  _filename: z.string().optional(),
})

export type Book = z.infer<typeof BookSchema>
export type BookStatus = z.infer<typeof BookStatusEnum>
