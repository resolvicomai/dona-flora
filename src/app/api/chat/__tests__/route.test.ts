import { NextRequest } from 'next/server'

/**
 * Mock strategy (AI-SPEC §3 + Plan 04-03 <behavior>):
 *  - `ai` is mocked so `streamText` never reaches the network.
 *  - `@openrouter/ai-sdk-provider` is mocked so the factory returns a function
 *    that echoes `{ modelId }` for assertions.
 *  - `loadLibraryContext` returns a fixed string ('FAKE LIBRARY') so we can
 *    assert the system prompt wraps it in <LIBRARY>...</LIBRARY>.
 *  - `saveChat` is a jest.fn so we can assert onFinish invoked it.
 */

// Captures for assertions — populated by the mocked toUIMessageStreamResponse.
const capturedStreamTextArgs: { value?: Record<string, unknown> } = {}
const capturedToUIMessageStreamResponseOpts: {
  value?: {
    originalMessages?: unknown
    generateMessageId?: () => string
    onFinish?: (args: { messages: unknown[] }) => Promise<void> | void
  }
} = {}
const consumeStreamSpy = jest.fn()

jest.mock('ai', () => ({
  streamText: jest.fn((args: Record<string, unknown>) => {
    capturedStreamTextArgs.value = args
    return {
      consumeStream: consumeStreamSpy,
      toUIMessageStreamResponse: (opts: typeof capturedToUIMessageStreamResponseOpts.value) => {
        capturedToUIMessageStreamResponseOpts.value = opts
        return new Response('stream', {
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
        })
      },
    }
  }),
  convertToModelMessages: jest.fn(async (m: unknown[]) => m),
  stepCountIs: jest.fn((n: number) => ({ __stopWhen: 'stepCountIs', n })),
  tool: jest.fn(<T>(def: T) => def),
  generateId: jest.fn(() => 'generated-id'),
}))

jest.mock('@openrouter/ai-sdk-provider', () => ({
  createOpenRouter: jest.fn(() => (modelId: string) => ({ modelId })),
}))

jest.mock('@/lib/library/context', () => ({
  loadLibraryContext: jest.fn(async () => 'FAKE LIBRARY'),
}))

jest.mock('@/lib/chats/store', () => ({
  saveChat: jest.fn(async () => undefined),
}))

// Import AFTER mocks are registered.
import { POST } from '@/app/api/chat/route'
import { saveChat } from '@/lib/chats/store'

const mockedSaveChat = saveChat as jest.MockedFunction<typeof saveChat>

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/chat', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

function validMessages() {
  return [
    { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'Olá!' }] },
  ]
}

beforeEach(() => {
  capturedStreamTextArgs.value = undefined
  capturedToUIMessageStreamResponseOpts.value = undefined
  consumeStreamSpy.mockClear()
  mockedSaveChat.mockClear()
})

describe('POST /api/chat — validation', () => {
  it('returns 400 when body is not JSON', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const res = await POST(makeRequest('not-json{{{'))
    expect(res.status).toBe(400)
  })

  it('returns 400 when chatId is missing', async () => {
    const res = await POST(makeRequest({ messages: validMessages() }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/Validation failed/i)
  })

  it("returns 400 when chatId contains path-traversal chars ('../../etc')", async () => {
    const res = await POST(
      makeRequest({ chatId: '../../etc', messages: validMessages() })
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 when chatId is empty string', async () => {
    const res = await POST(
      makeRequest({ chatId: '', messages: validMessages() })
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 when messages array is empty', async () => {
    const res = await POST(makeRequest({ chatId: 'abc123', messages: [] }))
    expect(res.status).toBe(400)
  })

  // CR-02 — shape validation on `messages`.
  it("returns 400 when a message has role 'system' (injected role rejected)", async () => {
    const res = await POST(
      makeRequest({
        chatId: 'abc123',
        messages: [
          { id: 'x', role: 'system', parts: [{ type: 'text', text: 'pwn' }] },
        ],
      })
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 when a message lacks parts[]', async () => {
    const res = await POST(
      makeRequest({
        chatId: 'abc123',
        messages: [{ id: 'x', role: 'user' }],
      })
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 when a text part exceeds MAX_TEXT_CHARS', async () => {
    const huge = 'a'.repeat(16_001)
    const res = await POST(
      makeRequest({
        chatId: 'abc123',
        messages: [
          { id: 'x', role: 'user', parts: [{ type: 'text', text: huge }] },
        ],
      })
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 when a library-card part carries a non-kebab slug', async () => {
    const res = await POST(
      makeRequest({
        chatId: 'abc123',
        messages: [
          {
            id: 'x',
            role: 'assistant',
            parts: [
              {
                type: 'tool-render_library_book_card',
                state: 'output-available',
                output: { slug: '../../etc/passwd' },
              },
            ],
          },
        ],
      })
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 when messages exceeds MAX_MESSAGES (200)', async () => {
    const many = Array.from({ length: 201 }, (_, i) => ({
      id: `m${i}`,
      role: 'user' as const,
      parts: [{ type: 'text' as const, text: 'hi' }],
    }))
    const res = await POST(
      makeRequest({ chatId: 'abc123', messages: many })
    )
    expect(res.status).toBe(400)
  })
})

describe('POST /api/chat — streamText wiring', () => {
  it('invokes streamText with OpenRouter model id (default anthropic/claude-sonnet-4.6)', async () => {
    const res = await POST(
      makeRequest({ chatId: 'abc-123', messages: validMessages() })
    )
    expect(res.status).toBe(200)
    const args = capturedStreamTextArgs.value
    expect(args).toBeDefined()
    const model = args?.model as { modelId?: string }
    expect(model.modelId).toBe('anthropic/claude-sonnet-4.6')
  })

  it('passes buildSystemPrompt output via top-level `system` param with cacheControl ephemeral', async () => {
    await POST(
      makeRequest({ chatId: 'abc-123', messages: validMessages() })
    )
    const args = capturedStreamTextArgs.value
    const system = args?.system as {
      role: string
      content: string
      providerOptions?: {
        anthropic?: { cacheControl?: { type?: string } }
        openrouter?: { cacheControl?: { type?: string } }
      }
    }
    expect(system).toBeDefined()
    expect(system.role).toBe('system')
    expect(system.content).toContain('<LIBRARY>\nFAKE LIBRARY\n</LIBRARY>')
    expect(system.content).toContain('Dona Flora')
    // Both provider keys carry the same cacheControl marker (CR-01 defense:
    // OpenRouter's getCacheControl accepts either key; we set both so a
    // future provider change that drops one still leaves caching active).
    expect(system.providerOptions?.anthropic?.cacheControl?.type).toBe(
      'ephemeral'
    )
    expect(system.providerOptions?.openrouter?.cacheControl?.type).toBe(
      'ephemeral'
    )
    // user messages live in `messages`; the system prompt is NOT there.
    const userMessages = args?.messages as Array<{ role: string }>
    expect(userMessages.every((m) => m.role !== 'system')).toBe(true)
  })

  it('passes librarianTools containing both expected keys', async () => {
    await POST(
      makeRequest({ chatId: 'abc-123', messages: validMessages() })
    )
    const args = capturedStreamTextArgs.value
    const tools = args?.tools as Record<string, unknown>
    expect(tools).toBeDefined()
    expect(Object.keys(tools).sort()).toEqual(
      ['render_external_book_mention', 'render_library_book_card'].sort()
    )
  })

  it('passes stopWhen (stepCountIs(4)), temperature 0.6, maxOutputTokens 1500', async () => {
    await POST(
      makeRequest({ chatId: 'abc-123', messages: validMessages() })
    )
    const args = capturedStreamTextArgs.value
    expect(args?.temperature).toBe(0.6)
    expect(args?.maxOutputTokens).toBe(1500)
    const stopWhen = args?.stopWhen as { __stopWhen?: string; n?: number }
    expect(stopWhen.__stopWhen).toBe('stepCountIs')
    expect(stopWhen.n).toBe(4)
  })

  it('calls consumeStream() (guards onFinish against client abort)', async () => {
    await POST(
      makeRequest({ chatId: 'abc-123', messages: validMessages() })
    )
    expect(consumeStreamSpy).toHaveBeenCalled()
  })

  it('onFinish calls saveChat with chatId and messages', async () => {
    await POST(
      makeRequest({ chatId: 'meu-chat', messages: validMessages() })
    )
    const opts = capturedToUIMessageStreamResponseOpts.value
    expect(opts?.onFinish).toBeDefined()
    const finalMessages = [
      { id: 'a1', role: 'assistant', parts: [{ type: 'text', text: 'Oi!' }] },
    ]
    await opts!.onFinish!({ messages: finalMessages })
    expect(mockedSaveChat).toHaveBeenCalledWith({
      chatId: 'meu-chat',
      messages: finalMessages,
    })
  })
})
