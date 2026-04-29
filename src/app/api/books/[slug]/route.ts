import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getSessionStorageContext,
  requireVerifiedRequestSession,
} from '@/lib/auth/server'
import {
  BookStatusEnum,
  DateOnlySchema,
  ISBN10Schema,
  ISBN13Schema,
} from '@/lib/books/schema'
import { updateBook, deleteBook } from '@/lib/books/library-service'

export const dynamic = 'force-dynamic'

const AuthorInputSchema = z.union([
  z.string().min(1),
  z.array(z.string().min(1)).min(1),
])

const UpdateBookSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().optional(),
  author: AuthorInputSchema.optional(),
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
  status: BookStatusEnum.optional(),
  priority: z.coerce.number().int().min(1).max(5).optional(),
  started_at: DateOnlySchema.optional(),
  finished_at: DateOnlySchema.optional(),
  progress: z.coerce.number().int().min(0).max(100).optional(),
  current_page: z.coerce.number().int().nonnegative().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const authResult = await requireVerifiedRequestSession(request)
    if (!authResult.ok) {
      return authResult.response
    }
    const session = authResult.session

    const { slug } = await params
    const body = await request.json()
    const result = UpdateBookSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }
    const updates: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(result.data)) {
      if (v !== undefined) updates[k] = v
    }
    await updateBook(
      slug,
      updates as Parameters<typeof updateBook>[1],
      getSessionStorageContext(session),
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[API] PUT /api/books/[slug] error:', err)
    if (err instanceof Error && err.message.includes('ENOENT')) {
      return NextResponse.json({ error: 'Livro não encontrado.' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erro ao atualizar livro.' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const authResult = await requireVerifiedRequestSession(_request)
    if (!authResult.ok) {
      return authResult.response
    }
    const session = authResult.session

    const { slug } = await params
    await deleteBook(slug, getSessionStorageContext(session))
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('[API] DELETE /api/books/[slug] error:', err)
    if (err instanceof Error && err.message.includes('ENOENT')) {
      return NextResponse.json({ error: 'Livro não encontrado.' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erro ao excluir livro.' }, { status: 500 })
  }
}
