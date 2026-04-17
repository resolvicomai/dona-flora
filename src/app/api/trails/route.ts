import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { saveTrail } from '@/lib/trails/store'

/**
 * POST /api/trails — creates a reading-trail `.md` in `data/trails/`.
 *
 * Each `book_refs[i]` is Zod-validated against the kebab-case slug regex
 * (Phase 2 D-02) so the client cannot smuggle path traversal into the trail's
 * body via a fake slug (threat T-04-10). The `title` separately passes through
 * `generateSlug` inside `saveTrail` with `slugify({ strict: true })` — a
 * second barrier that strips any surviving disallowed characters.
 */

export const dynamic = 'force-dynamic'

const KEBAB_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const CreateTrailSchema = z.object({
  title: z.string().min(1).max(120),
  goal: z.string().max(500).optional(),
  book_refs: z
    .array(z.string().regex(KEBAB_SLUG, 'slug deve ser kebab-case ASCII'))
    .min(1)
    .max(20),
  notes: z.string().max(2000).optional(),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch (err) {
    console.error('[API] POST /api/trails invalid JSON:', err)
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = CreateTrailSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const { slug } = await saveTrail(parsed.data)
    return NextResponse.json({ slug }, { status: 201 })
  } catch (err) {
    console.error('[API] POST /api/trails error:', err)
    return NextResponse.json(
      { error: 'Erro ao salvar trilha.' },
      { status: 500 }
    )
  }
}
