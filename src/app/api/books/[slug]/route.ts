import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { BookStatusEnum } from '@/lib/books/schema'
import { updateBook, deleteBook } from '@/lib/books/library-service'

export const dynamic = 'force-dynamic'

const UpdateBookSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  isbn: z.string().optional(),
  synopsis: z.string().optional(),
  cover: z.string().url().optional(),
  genre: z.string().optional(),
  year: z.coerce.number().int().optional(),
  status: BookStatusEnum.optional(),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  notes: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
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
      if (v !== undefined && v !== null) updates[k] = v
    }
    await updateBook(slug, updates as Parameters<typeof updateBook>[1])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[API] PUT /api/books/[slug] error:', err)
    if (err instanceof Error && err.message.includes('ENOENT')) {
      return NextResponse.json({ error: 'Livro nao encontrado.' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erro ao atualizar livro.' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    await deleteBook(slug)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('[API] DELETE /api/books/[slug] error:', err)
    if (err instanceof Error && err.message.includes('ENOENT')) {
      return NextResponse.json({ error: 'Livro nao encontrado.' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erro ao excluir livro.' }, { status: 500 })
  }
}
