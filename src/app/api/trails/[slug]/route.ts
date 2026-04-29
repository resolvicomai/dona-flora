import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getSessionStorageContext,
  requireVerifiedRequestSession,
} from '@/lib/auth/server'
import { deleteTrail, updateTrail } from '@/lib/trails/store'

export const dynamic = 'force-dynamic'

const TrailSlugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const UpdateTrailSchema = z
  .object({
    goal: z.string().max(500).optional(),
    notes: z.string().max(4000).optional(),
    title: z.string().trim().min(1).max(120).optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.goal !== undefined ||
      value.notes !== undefined,
    { message: 'Informe pelo menos um campo para atualizar.' },
  )

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const authResult = await requireVerifiedRequestSession(request)
  if (!authResult.ok) {
    return authResult.response
  }
  const session = authResult.session
  const { slug } = await params
  const parsedSlug = TrailSlugSchema.safeParse(slug)
  if (!parsedSlug.success) {
    return NextResponse.json({ error: 'Invalid trail slug' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const parsedBody = UpdateTrailSchema.safeParse(body)
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: 'Dados inválidos.', details: parsedBody.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const trail = await updateTrail({
      ...parsedBody.data,
      context: getSessionStorageContext(session),
      slug: parsedSlug.data,
    })
    if (!trail) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, trail })
  } catch (err) {
    console.error('[API] PATCH /api/trails/[slug] error:', err)
    return NextResponse.json(
      { error: 'Erro ao atualizar trilha.' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const authResult = await requireVerifiedRequestSession(request)
  if (!authResult.ok) {
    return authResult.response
  }
  const session = authResult.session
  const { slug } = await params
  const parsedSlug = TrailSlugSchema.safeParse(slug)
  if (!parsedSlug.success) {
    return NextResponse.json({ error: 'Invalid trail slug' }, { status: 400 })
  }

  try {
    const removed = await deleteTrail(
      parsedSlug.data,
      getSessionStorageContext(session),
    )
    if (!removed) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('[API] DELETE /api/trails/[slug] error:', err)
    return NextResponse.json(
      { error: 'Erro ao excluir trilha.' },
      { status: 500 },
    )
  }
}
