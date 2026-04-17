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
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { loadLibraryContext } from '@/lib/library/context'
import { saveChat } from '@/lib/chats/store'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { librarianTools, type LibrarianTools } from '@/lib/ai/tools'
import type { LibrarianMessage } from '@/lib/chats/types'

/**
 * POST /api/chat — Dona Flora streaming endpoint (AI-SPEC §3).
 *
 * Wires Vercel AI SDK v6 + @ai-sdk/anthropic to stream a pt-BR response, with
 * the static persona/rules header marked `cacheControl: ephemeral` and the
 * dynamic <LIBRARY> block appended. Two read-only UI tools render inline book
 * cards. `onFinish` persists the full conversation to `data/chats/{chatId}.md`
 * — guarded by `result.consumeStream()` so it fires even on client abort
 * (AI-SPEC §3 pitfall #6).
 *
 * Path traversal on `chatId` is closed here via a Zod regex BEFORE the value
 * ever reaches `saveChat` (threat T-04-09).
 *
 * Model ID confirmed: `claude-sonnet-4-5` (AI-SPEC §4 line 449 + Context7
 * lookup 2026-04-17).
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

    const systemMessage = {
      role: 'system' as const,
      content: [
        {
          type: 'text' as const,
          text: buildSystemPrompt(libraryContext),
          // AI-SPEC §3 pitfall #4: cacheControl MUST live on the content part,
          // not on a `system: 'string'` shorthand — otherwise Anthropic never
          // caches the large library payload (we pay full price every turn).
          providerOptions: {
            anthropic: { cacheControl: { type: 'ephemeral' } },
          },
        },
      ],
    }

    const result = streamText({
      model: anthropic('claude-sonnet-4-5'),
      messages: [
        systemMessage,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(await convertToModelMessages(messages as any)),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any,
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
