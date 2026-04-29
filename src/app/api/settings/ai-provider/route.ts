import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { upsertUserAIProviderSettings, type AIProviderSettingsInput } from '@/lib/auth/db'
import { maskAIProviderSettings } from '@/lib/ai/provider'
import { requireVerifiedRequestSession } from '@/lib/auth/server'

const AIProviderSettingsSchema = z.object({
  anthropicModel: z.string().trim().min(1).optional(),
  compatibleBaseUrl: z.string().trim().url().optional(),
  compatibleModel: z.string().trim().min(1).optional(),
  fallbackApiKey: z.string().trim().optional().nullable(),
  fallbackEnabled: z.boolean(),
  fallbackModel: z.string().trim().min(1).optional(),
  fallbackProvider: z.literal('openrouter').optional(),
  ollamaBaseUrl: z.string().trim().url(),
  ollamaModel: z.string().trim().min(1),
  openaiModel: z.string().trim().min(1).optional(),
  openrouterModel: z.string().trim().min(1).optional(),
  primaryApiKey: z.string().trim().optional().nullable(),
  primaryProvider: z.enum(['anthropic', 'ollama', 'openai', 'openai-compatible', 'openrouter']),
  visionEnabled: z.boolean().optional(),
  visionModel: z.string().trim().min(1).optional(),
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

  const parsed = AIProviderSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Configuração de IA inválida.', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const settings = upsertUserAIProviderSettings(
    authResult.session.user.id,
    parsed.data as AIProviderSettingsInput,
  )

  return NextResponse.json({
    ok: true,
    settings: maskAIProviderSettings(settings),
  })
}
