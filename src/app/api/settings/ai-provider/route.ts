import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { upsertUserAIProviderSettings, type AIProviderSettingsInput } from '@/lib/auth/db'
import { isLikelyChatModel, maskAIProviderSettings } from '@/lib/ai/provider'
import { requireVerifiedRequestSession } from '@/lib/auth/server'

/**
 * Server-side guard against picking a non-conversational model. The Settings
 * UI already filters embedding/reranker/autocomplete ids out of the picker,
 * but we re-validate here so:
 *   - users with a stale selection saved before the filter shipped are
 *     forced to choose a working model on their next save;
 *   - anyone bypassing the UI (curl, replay) gets a clear error instead of
 *     silently breaking the chat for themselves;
 *   - Ollama vision/audio specialists added in the future are caught by the
 *     same heuristic without a code change.
 *
 * Vision and OpenRouter slugs are NOT validated through this — vision is
 * resolved separately and OpenRouter slugs (`anthropic/claude-...`) carry
 * vendor prefixes that the heuristic doesn't expect.
 */
function nonChatModelMessage(field: string, value: string): string {
  return `O modelo "${value}" parece ser um especialista (embedding, reranker, autocomplete, áudio ou vídeo) e não suporta chat. Escolha outro em ${field}.`
}

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

  // Reject specialist models before they hit the database. Each provider has
  // its own model field; we only validate the chat-completion ones.
  const data = parsed.data
  const chatModelFields: Array<{ field: string; label: string; value?: string }> = [
    { field: 'ollamaModel', label: 'Ollama', value: data.ollamaModel },
    { field: 'compatibleModel', label: 'OpenAI-compatible', value: data.compatibleModel },
    { field: 'openaiModel', label: 'OpenAI', value: data.openaiModel },
    { field: 'anthropicModel', label: 'Anthropic', value: data.anthropicModel },
  ]
  for (const { field, label, value } of chatModelFields) {
    if (value && !isLikelyChatModel(value)) {
      return NextResponse.json(
        {
          error: nonChatModelMessage(label, value),
          details: { fieldErrors: { [field]: [`modelo "${value}" não é conversacional`] } },
        },
        { status: 400 },
      )
    }
  }

  const settings = upsertUserAIProviderSettings(
    authResult.session.user.id,
    data as AIProviderSettingsInput,
  )

  return NextResponse.json({
    ok: true,
    settings: maskAIProviderSettings(settings),
  })
}
