import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { BookStatusEnum } from '@/lib/books/schema'
import { writeBook } from '@/lib/books/library-service'

export const dynamic = 'force-dynamic'

const CreateBookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  isbn: z.string().optional(),
  synopsis: z.string().optional(),
  cover: z.string().url().optional(),
  genre: z.string().optional(),
  year: z.coerce.number().int().optional(),
  status: BookStatusEnum,
  rating: z.coerce.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = CreateBookSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }
    const { slug } = await writeBook(result.data)
    return NextResponse.json({ slug }, { status: 201 })
  } catch (err) {
    console.error('[API] POST /api/books error:', err)
    return NextResponse.json(
      { error: 'Erro ao criar livro.' },
      { status: 500 }
    )
  }
}
