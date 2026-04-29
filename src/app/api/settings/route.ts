import { NextRequest, NextResponse } from 'next/server'
import { AISettingsSchema, normalizeAISettings, type AISettings } from '@/lib/ai/settings'
import { upsertUserSettings } from '@/lib/auth/db'
import { requireVerifiedRequestSession } from '@/lib/auth/server'

export async function PUT(request: NextRequest) {
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

  const parsed = AISettingsSchema.safeParse(normalizeAISettings(body as Partial<AISettings>))

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Settings invalidas.', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const settings = upsertUserSettings(session.user.id, parsed.data)
  return NextResponse.json({ ok: true, settings })
}
