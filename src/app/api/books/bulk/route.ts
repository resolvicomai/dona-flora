import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getSessionStorageContext, requireVerifiedRequestSession } from '@/lib/auth/server'
import { getBook, updateBook } from '@/lib/books/library-service'
import { BookStatusEnum } from '@/lib/books/schema'

export const dynamic = 'force-dynamic'

const BookSlugSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, 'Slug invalido.')

const TagsSchema = z.array(z.string().trim().min(1)).max(40)

const BulkBookUpdatesSchema = z
  .object({
    current_page: z.coerce.number().int().nonnegative().optional().nullable(),
    priority: z.coerce.number().int().min(1).max(5).optional().nullable(),
    progress: z.coerce.number().int().min(0).max(100).optional().nullable(),
    rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
    status: BookStatusEnum.optional(),
    tagMode: z.enum(['replace', 'add', 'remove']).optional(),
    tags: TagsSchema.optional().nullable(),
  })
  .superRefine((updates, ctx) => {
    const keys = Object.entries(updates).filter(([, value]) => value !== undefined)
    if (keys.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Escolha pelo menos um campo para atualizar.',
      })
    }

    if (updates.tagMode && updates.tags === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe as tags quando escolher uma ação de tags.',
        path: ['tags'],
      })
    }

    if (
      (updates.tagMode === 'add' || updates.tagMode === 'remove') &&
      (!updates.tags || updates.tags.length === 0)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Adicionar/remover tags exige pelo menos uma tag.',
        path: ['tags'],
      })
    }
  })

const BulkBooksSchema = z.object({
  slugs: z.array(BookSlugSchema).min(1).max(200),
  updates: BulkBookUpdatesSchema,
})

function normalizeTag(tag: string) {
  return tag.trim().replace(/^#/, '').toLowerCase()
}

function mergeTags(
  currentTags: string[] | undefined,
  incoming: string[] | null | undefined,
  mode: 'replace' | 'add' | 'remove' | undefined,
) {
  if (incoming === undefined) return undefined
  const normalizedIncoming = (incoming ?? []).map(normalizeTag).filter(Boolean)

  if (!mode || mode === 'replace') {
    return normalizedIncoming.length > 0 ? normalizedIncoming : null
  }

  const current = new Set((currentTags ?? []).map(normalizeTag).filter(Boolean))

  if (mode === 'add') {
    for (const tag of normalizedIncoming) current.add(tag)
  } else {
    for (const tag of normalizedIncoming) current.delete(tag)
  }

  return current.size > 0 ? Array.from(current).sort() : null
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireVerifiedRequestSession(request)
    if (!authResult.ok) {
      return authResult.response
    }

    const body = await request.json()
    const result = BulkBooksSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 },
      )
    }

    const storageContext = getSessionStorageContext(authResult.session)
    const slugs = Array.from(new Set(result.data.slugs))
    const { tagMode, tags, ...plainUpdates } = result.data.updates
    const failed: Array<{ slug: string; error: string }> = []
    let updatedCount = 0

    for (const slug of slugs) {
      try {
        const current = await getBook(slug, storageContext)
        if (!current) {
          failed.push({ slug, error: 'Livro não encontrado.' })
          continue
        }

        const updates: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(plainUpdates)) {
          if (value !== undefined) updates[key] = value
        }

        const nextTags = mergeTags(current.tags, tags, tagMode)
        if (nextTags !== undefined) {
          updates.tags = nextTags
        }

        await updateBook(slug, updates, storageContext)
        updatedCount++
      } catch (err) {
        failed.push({
          slug,
          error: err instanceof Error ? err.message : 'Erro ao atualizar.',
        })
      }
    }

    return NextResponse.json(
      {
        failed,
        ok: failed.length === 0,
        requestedCount: slugs.length,
        updatedCount,
      },
      { status: failed.length > 0 ? 207 : 200 },
    )
  } catch (err) {
    console.error('[API] PATCH /api/books/bulk error:', err)
    return NextResponse.json({ error: 'Erro ao atualizar livros em massa.' }, { status: 500 })
  }
}
