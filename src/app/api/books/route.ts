import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionStorageContext, requireVerifiedRequestSession } from '@/lib/auth/server'
import { BookStatusEnum, DateOnlySchema, ISBN10Schema, ISBN13Schema } from '@/lib/books/schema'
import { writeBook } from '@/lib/books/library-service'

export const dynamic = 'force-dynamic'

const AuthorInputSchema = z.union([z.string().min(1), z.array(z.string().min(1)).min(1)])

const CreateBookSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  author: AuthorInputSchema,
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
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireVerifiedRequestSession(request)
    if (!authResult.ok) {
      return authResult.response
    }
    const session = authResult.session

    const body = await request.json()
    const result = CreateBookSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 },
      )
    }
    const { slug } = await writeBook(result.data, getSessionStorageContext(session))
    return NextResponse.json({ slug }, { status: 201 })
  } catch (err) {
    console.error('[API] POST /api/books error:', err)
    return NextResponse.json({ error: 'Erro ao criar livro.' }, { status: 500 })
  }
}
