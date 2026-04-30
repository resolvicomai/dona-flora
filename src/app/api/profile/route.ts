import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { updateUserDisplayName } from '@/lib/auth/db'
import { requireVerifiedRequestSession } from '@/lib/auth/server'

const UpdateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
})

export async function PATCH(request: NextRequest) {
  const authResult = await requireVerifiedRequestSession(request)
  if (!authResult.ok) {
    return authResult.response
  }
  const session = authResult.session

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalido.' }, { status: 400 })
  }

  const parsed = UpdateProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados invalidos.', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  updateUserDisplayName(session.user.id, parsed.data.displayName)
  return NextResponse.json({ ok: true })
}
