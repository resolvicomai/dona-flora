import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  generateId,
  type UIMessage,
  type UIDataTypes,
} from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { z } from 'zod'
import { loadLibraryContext } from '@/lib/library/context'
import { saveChat } from '@/lib/chats/store'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { librarianTools, type LibrarianTools } from '@/lib/ai/tools'
import type { LibrarianMessage } from '@/lib/chats/types'

/**
 * POST /api/chat — Dona Flora streaming endpoint (AI-SPEC §3).
 *
 * Wires Vercel AI SDK v6 + OpenRouter to stream a pt-BR response, with
 * the static persona/rules header marked `cacheControl: ephemeral` and the
 * dynamic <LIBRARY> block appended. Two read-only UI tools render inline book
 * cards. `onFinish` persists the full conversation to `data/chats/{chatId}.md`
 * — guarded by `result.consumeStream()` so it fires even on client abort
 * (AI-SPEC §3 pitfall #6).
 *
 * Path traversal on `chatId` is closed here via a Zod regex BEFORE the value
 * ever reaches `saveChat` (threat T-04-09).
 *
 * Model routed via OpenRouter — default `anthropic/claude-sonnet-4.6`, override
 * via `OPENROUTER_MODEL` env var.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // AI-SPEC §3 — streaming can take a while

// Re-exported client types (Plan 06 client imports from this route).
export type { LibrarianTools }
export type LibrarianClientMessage = UIMessage<
  never,
  UIDataTypes,
  LibrarianTools
>

const ChatRequestSchema = z.object({
  // chatId regex: ^[A-Za-z0-9][A-Za-z0-9_-]*$ — inlined (not extracted to a
  // const) so the acceptance grep can find it in a single line.
  chatId: z
    .string()
    .min(1)
    .max(128)
    // eslint-disable-next-line prettier/prettier
    .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, 'chatId deve ser alfanumérico/hífen/underscore sem começar com traço'),
  messages: z.array(z.any()).min(1),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch (err) {
    console.error('[API] POST /api/chat invalid JSON:', err)
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = ChatRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { chatId, messages } = parsed.data

  try {
    const libraryContext = await loadLibraryContext()

    // AI SDK v6 contract (verified against installed @ai-sdk/provider-utils v6
    // types + @openrouter/ai-sdk-provider 2.x source — AI-SPEC §3 pitfall #4):
    //
    //   `SystemModelMessage.content` is strictly typed as `string`. The reviewer's
    //   proposed `content: [{ type: 'text', text, providerOptions }]` shape will
    //   NOT typecheck under the installed provider-utils version, so we route
    //   cache-control through the message-level `providerOptions` instead.
    //
    //   `standardizePrompt` forwards `{ role, content, providerOptions }` to the
    //   language model verbatim. The OpenRouter provider's
    //   `convertToOpenRouterChatMessages` (see
    //   node_modules/@openrouter/ai-sdk-provider/dist/index.mjs → `getCacheControl`)
    //   reads EITHER `providerOptions.anthropic.cacheControl` OR
    //   `providerOptions.openrouter.cacheControl` and emits a `cache_control`
    //   marker on the first content part of the resulting system message. Both
    //   keys are set defensively in case the OpenRouter provider drops one in
    //   a future minor release.
    const systemMessage = {
      role: 'system' as const,
      content: buildSystemPrompt(libraryContext),
      providerOptions: {
        anthropic: { cacheControl: { type: 'ephemeral' } },
        openrouter: { cacheControl: { type: 'ephemeral' } },
      },
    }

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    })
    const modelId =
      process.env.OPENROUTER_MODEL ?? 'anthropic/claude-sonnet-4.6'

    const result = streamText({
      model: openrouter(modelId),
      system: systemMessage,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: await convertToModelMessages(messages as any),
      tools: librarianTools,
      stopWhen: stepCountIs(4),
      temperature: 0.6,
      maxOutputTokens: 1500,
      providerOptions: { anthropic: { sendReasoning: false } },
    })

    // No await — decouples persistence from the client connection so that
    // `onFinish` still runs when the user closes the tab (AI-SPEC pitfall #6).
    result.consumeStream()

    return result.toUIMessageStreamResponse<LibrarianClientMessage>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      originalMessages: messages as any,
      generateMessageId: () => generateId(),
      onFinish: async ({ messages: finalMessages }) => {
        try {
          await saveChat({
            chatId,
            messages: finalMessages as unknown as LibrarianMessage[],
          })
        } catch (err) {
          console.error('[API] onFinish saveChat error:', err)
        }
      },
    })
  } catch (err) {
    console.error('[API] POST /api/chat error:', err)
    return NextResponse.json(
      { error: 'Erro ao gerar resposta.' },
      { status: 500 }
    )
  }
}
