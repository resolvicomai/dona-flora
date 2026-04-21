import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getSessionStorageContext,
  requireVerifiedRequestSession,
} from '@/lib/auth/server'
import { saveTrail } from '@/lib/trails/store'
import { loadKnownSlugs } from '@/lib/library/slug-set'

/**
 * POST /api/trails — creates a reading-trail `.md` in `data/trails/`.
 *
 * Each `book_refs[i]` is Zod-validated against the kebab-case slug regex
 * (Phase 2 D-02) so the client cannot smuggle path traversal into the trail's
 * body via a fake slug (threat T-04-10). The `title` separately passes through
 * `generateSlug` inside `saveTrail` with `slugify({ strict: true })` — a
 * second barrier that strips any surviving disallowed characters.
 *
 * WR-06: After regex validation, every ref is also cross-checked against
 * `loadKnownSlugs()` — a trail that points at a slug that does not exist on
 * disk is meaningless and the cards render as "(livro mencionado
 * indisponível)" via the D-14 fallback. Rejecting at the boundary avoids
 * persisting a dangling reference that will silently stay broken.
 */

export const dynamic = 'force-dynamic'

const KEBAB_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// WR-09: mirror TrailFrontmatterSchema's HAS_SLUG_CHAR refinement at the
// boundary so the API returns a 400 on punctuation-only titles instead of
// relying on the store's own validation throw (which returns 500).
const HAS_SLUG_CHAR = /[a-z0-9]/i

const CreateTrailSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(120)
    .refine((s) => HAS_SLUG_CHAR.test(s), {
      message: 'título precisa conter pelo menos uma letra ou número',
    }),
  goal: z.string().max(500).optional(),
  book_refs: z
    .array(z.string().regex(KEBAB_SLUG, 'slug deve ser kebab-case ASCII'))
    .min(1)
    .max(20),
  notes: z.string().max(2000).optional(),
})

export async function POST(request: NextRequest) {
  const authResult = await requireVerifiedRequestSession(request)
  if (!authResult.ok) {
    return authResult.response
  }
  const session = authResult.session

  const storageContext = getSessionStorageContext(session)
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

  // WR-06: reject refs that pass the kebab regex but don't exist on disk.
  const knownSlugs = await loadKnownSlugs(storageContext)
  const unknownRefs = parsed.data.book_refs.filter((s) => !knownSlugs.has(s))
  if (unknownRefs.length > 0) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: {
          fieldErrors: { book_refs: [`slug(s) desconhecido(s): ${unknownRefs.join(', ')}`] },
        },
      },
      { status: 400 }
    )
  }

  try {
    const { slug } = await saveTrail(parsed.data, storageContext)
    return NextResponse.json({ slug }, { status: 201 })
  } catch (err) {
    console.error('[API] POST /api/trails error:', err)
    return NextResponse.json(
      { error: 'Erro ao salvar trilha.' },
      { status: 500 }
    )
  }
}
