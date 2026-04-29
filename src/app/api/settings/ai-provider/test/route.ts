import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { testAIProviderConnection } from '@/lib/ai/provider'
import {
  getUserAIPrimaryProviderSecret,
  getUserAIProviderSecret,
  type AIPrimaryProvider,
} from '@/lib/auth/db'
import { requireVerifiedRequestSession } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ProviderTestSchema = z.object({
  apiKey: z.string().trim().optional().nullable(),
  baseUrl: z.string().trim().url().optional().nullable(),
  provider: z.enum([
    'anthropic',
    'ollama',
    'openai',
    'openai-compatible',
    'openrouter',
  ]),
})

export async function POST(request: NextRequest) {
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

  const parsed = ProviderTestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'URL do provedor invalida.', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const provider = parsed.data.provider as AIPrimaryProvider
  const savedKey =
    getUserAIPrimaryProviderSecret(authResult.session.user.id, provider) ??
    (provider === 'openrouter'
      ? getUserAIProviderSecret(authResult.session.user.id)
      : null)
  const result = await testAIProviderConnection({
    apiKey: parsed.data.apiKey || savedKey,
    baseUrl: parsed.data.baseUrl,
    provider,
  })
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        models: [],
        ok: false,
      },
      { status: 503 },
    )
  }

  return NextResponse.json({
    models: result.models,
    ok: true,
    recommendedModel: result.models[0]?.id ?? null,
  })
}
