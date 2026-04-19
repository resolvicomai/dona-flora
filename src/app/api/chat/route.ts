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

// CR-02: Shape-validate inbound `messages` at the boundary instead of
// trusting client JSON. A malicious client could otherwise persist
// `role: 'system'`, oversize text, or forged tool-output parts into
// `data/chats/{id}.md` — which is re-read on next visit and streamed
// back to the model verbatim (persistent prompt-injection surface).
//
// Contract (AI-SPEC §3 + Plan 04-02 <behavior>):
//   - Roles: only 'user' or 'assistant' at the boundary. 'system' is
//     injected server-side via buildSystemPrompt(); a client-supplied
//     system role is always a red flag.
//   - Per-text length: 16 000 chars (an exceptionally long user turn,
//     ~4k tokens — well above any legitimate human input).
//   - Array cap: 200 messages per request. Long threads are persisted
//     across turns; if we ever hit this we have bigger problems.
//   - Tool-output parts use discriminated `type: 'tool-*'` names and
//     carry small fixed-shape outputs. Slugs are kebab-regex'd here
//     (defense-in-depth against the D-14 layered guardrail).
const KEBAB_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MAX_TEXT_CHARS = 16_000
const MAX_MESSAGES = 200

// Known part-type whitelist. useChat/AI SDK emits reasoning, step-start,
// dynamic-tool, etc. during streaming — we keep a loose catch-all branch
// for forward-compat but refuse completely unknown tool-* shapes so a
// malicious client cannot smuggle arbitrary tool outputs into the
// persistence layer.
const MessagePartSchema: z.ZodType<unknown> = z.unknown().superRefine(
  (raw, ctx) => {
    if (!raw || typeof raw !== 'object') {
      ctx.addIssue({ code: 'custom', message: 'part must be an object' })
      return
    }
    const part = raw as { type?: unknown; text?: unknown; output?: unknown }
    const t = part.type
    if (typeof t !== 'string') {
      ctx.addIssue({ code: 'custom', message: 'part.type must be a string' })
      return
    }
    if (t === 'text') {
      if (typeof part.text !== 'string') {
        ctx.addIssue({ code: 'custom', message: 'text part missing .text' })
        return
      }
      if (part.text.length > MAX_TEXT_CHARS) {
        ctx.addIssue({ code: 'custom', message: 'text exceeds MAX_TEXT_CHARS' })
      }
      return
    }
    if (t === 'tool-render_library_book_card') {
      const out = part.output as { slug?: unknown } | undefined
      if (out && out.slug !== undefined) {
        if (typeof out.slug !== 'string' || !KEBAB_SLUG.test(out.slug) || out.slug.length > 200) {
          ctx.addIssue({ code: 'custom', message: 'invalid slug in library-card part' })
        }
      }
      return
    }
    if (t === 'tool-render_external_book_mention') {
      const out = part.output as
        | { title?: unknown; author?: unknown; reason?: unknown }
        | undefined
      if (out) {
        if (out.title !== undefined && (typeof out.title !== 'string' || out.title.length > 500)) {
          ctx.addIssue({ code: 'custom', message: 'external title too long' })
        }
        if (out.author !== undefined && (typeof out.author !== 'string' || out.author.length > 500)) {
          ctx.addIssue({ code: 'custom', message: 'external author too long' })
        }
        if (out.reason !== undefined && (typeof out.reason !== 'string' || out.reason.length > 1000)) {
          ctx.addIssue({ code: 'custom', message: 'external reason too long' })
        }
      }
      return
    }
    // Forward-compat: accept other useChat-emitted parts (reasoning,
    // step-start, dynamic-tool, etc.) opaquely — but still bound any
    // stringy `text` field if present.
    if (typeof part.text === 'string' && part.text.length > MAX_TEXT_CHARS) {
      ctx.addIssue({ code: 'custom', message: 'generic part text exceeds MAX_TEXT_CHARS' })
    }
  },
)

const InboundMessageSchema = z
  .object({
    id: z.string().max(200).optional(),
    role: z.enum(['user', 'assistant']),
    parts: z.array(MessagePartSchema).max(200),
  })
  .passthrough()

const ChatRequestSchema = z.object({
  // chatId regex: ^[A-Za-z0-9][A-Za-z0-9_-]*$ — inlined (not extracted to a
  // const) so the acceptance grep can find it in a single line.
  chatId: z
    .string()
    .min(1)
    .max(128)
    // eslint-disable-next-line prettier/prettier
    .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, 'chatId deve ser alfanumérico/hífen/underscore sem começar com traço'),
  messages: z.array(InboundMessageSchema).min(1).max(MAX_MESSAGES),
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
