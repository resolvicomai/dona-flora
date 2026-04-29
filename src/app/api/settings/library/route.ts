import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { upsertUserLibrarySettings } from '@/lib/auth/db'
import { requireVerifiedRequestSession } from '@/lib/auth/server'
import { validateBooksDirectory } from '@/lib/storage/library-settings'

const LibrarySettingsSchema = z.object({
  booksDir: z.string().trim().min(1),
})

export async function PUT(request: NextRequest) {
  const authResult = await requireVerifiedRequestSession(request)
  if (!authResult.ok) {
    return authResult.response
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalido.' }, { status: 400 })
  }

  const parsed = LibrarySettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Pasta invalida.', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const validation = await validateBooksDirectory(parsed.data.booksDir)
    upsertUserLibrarySettings(authResult.session.user.id, validation.booksDir)
    return NextResponse.json({ ok: true, ...validation })
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Não foi possível validar a pasta.',
      },
      { status: 400 },
    )
  }
}
