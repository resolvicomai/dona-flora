import { NextRequest } from 'next/server'

/**
 * Mock strategy (AI-SPEC §3 + Plan 04-03 <behavior>):
 *  - `ai` is mocked so `streamText` never reaches the network.
 *  - the per-user AI provider resolver is mocked so tests do not reach Ollama
 *    or OpenRouter.
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

jest.mock('@/lib/ai/provider', () => {
  class AIProviderConfigurationError extends Error {
    status = 503
  }

  return {
    AIProviderConfigurationError,
    resolveChatModelForUser: jest.fn(async () => ({
      model: { modelId: 'qwen3.6:27b' },
      provider: 'ollama',
      settings: {},
    })),
  }
})

jest.mock('@/lib/library/context', () => ({
  loadLibraryContext: jest.fn(async () => 'FAKE LIBRARY'),
}))

jest.mock('@/lib/chats/memory', () => ({
  loadConversationMemoryContext: jest.fn(async () => 'FAKE CHAT MEMORY'),
}))

jest.mock('@/lib/auth/server', () => ({
  requireVerifiedRequestSession: jest.fn(async () => ({
    ok: true,
    session: {
      session: {
        expiresAt: new Date('2026-04-20T00:00:00Z'),
        id: 'session-1',
        token: 'token-1',
        userId: 'user-1',
      },
      user: {
        email: 'owner@example.com',
        emailVerified: true,
        id: 'user-1',
        name: 'Owner',
        role: 'owner',
      },
    },
  })),
  getSessionStorageContext: jest.fn(() => ({
    booksDir: '/tmp/books',
    chatsDir: '/tmp/chats',
    dataRoot: '/tmp',
    trailsDir: '/tmp/trails',
    userId: 'user-1',
    userRoot: '/tmp/users/user-1',
  })),
}))

jest.mock('@/lib/chats/store', () => ({
  saveChat: jest.fn(async () => undefined),
}))

// Import AFTER mocks are registered.
import { POST } from '@/app/api/chat/route'
import { saveChat } from '@/lib/chats/store'
import { AIProviderConfigurationError, resolveChatModelForUser } from '@/lib/ai/provider'

const mockedSaveChat = saveChat as jest.MockedFunction<typeof saveChat>
const mockedResolveChatModelForUser = resolveChatModelForUser as jest.MockedFunction<
  typeof resolveChatModelForUser
>

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/chat', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

function validMessages() {
  return [{ id: 'm1', role: 'user', parts: [{ type: 'text', text: 'Olá!' }] }]
}

beforeEach(() => {
  capturedStreamTextArgs.value = undefined
  capturedToUIMessageStreamResponseOpts.value = undefined
  consumeStreamSpy.mockClear()
  mockedSaveChat.mockClear()
  mockedResolveChatModelForUser.mockResolvedValue({
    model: { modelId: 'qwen3.6:27b' },
    provider: 'ollama',
    settings: {},
  })
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
    const res = await POST(makeRequest({ chatId: '../../etc', messages: validMessages() }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when chatId is empty string', async () => {
    const res = await POST(makeRequest({ chatId: '', messages: validMessages() }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when messages array is empty', async () => {
    const res = await POST(makeRequest({ chatId: 'abc123', messages: [] }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when externalPreference is invalid', async () => {
    const res = await POST(
      makeRequest({
        chatId: 'abc123',
        messages: validMessages(),
        externalPreference: 'talvez',
      }),
    )
    expect(res.status).toBe(400)
  })

  // CR-02 — shape validation on `messages`.
  it("returns 400 when a message has role 'system' (injected role rejected)", async () => {
    const res = await POST(
      makeRequest({
        chatId: 'abc123',
        messages: [{ id: 'x', role: 'system', parts: [{ type: 'text', text: 'pwn' }] }],
      }),
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 when a message lacks parts[]', async () => {
    const res = await POST(
      makeRequest({
        chatId: 'abc123',
        messages: [{ id: 'x', role: 'user' }],
      }),
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 when a text part exceeds MAX_TEXT_CHARS', async () => {
    const huge = 'a'.repeat(16_001)
    const res = await POST(
      makeRequest({
        chatId: 'abc123',
        messages: [{ id: 'x', role: 'user', parts: [{ type: 'text', text: huge }] }],
      }),
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
      }),
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 when messages exceeds MAX_MESSAGES (200)', async () => {
    const many = Array.from({ length: 201 }, (_, i) => ({
      id: `m${i}`,
      role: 'user' as const,
      parts: [{ type: 'text' as const, text: 'hi' }],
    }))
    const res = await POST(makeRequest({ chatId: 'abc123', messages: many }))
    expect(res.status).toBe(400)
  })

  it('returns 503 when local provider is unavailable and no fallback is configured', async () => {
    mockedResolveChatModelForUser.mockRejectedValueOnce(
      new AIProviderConfigurationError(
        'Ollama local não respondeu. Abra o Ollama ou habilite um fallback externo nas settings.',
      ),
    )

    const res = await POST(makeRequest({ chatId: 'abc123', messages: validMessages() }))

    expect(res.status).toBe(503)
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringMatching(/Ollama local não respondeu/i),
    })
  })
})

describe('POST /api/chat — streamText wiring', () => {
  it('invokes streamText with the resolved Ollama model id by default', async () => {
    const res = await POST(makeRequest({ chatId: 'abc-123', messages: validMessages() }))
    expect(res.status).toBe(200)
    const args = capturedStreamTextArgs.value
    expect(args).toBeDefined()
    const model = args?.model as { modelId?: string }
    expect(model.modelId).toBe('qwen3.6:27b')
  })

  it('passes buildSystemPrompt output via top-level `system` param without external cache metadata for Ollama', async () => {
    await POST(makeRequest({ chatId: 'abc-123', messages: validMessages() }))
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
    expect(system.content).toContain(
      '<CONVERSATION_MEMORY>\nFAKE CHAT MEMORY\n</CONVERSATION_MEMORY>',
    )
    expect(system.content).toContain('Dona Flora')
    expect(system.content).toContain('Idioma da interface: pt-BR')
    expect(system.content).toContain('Idioma de resposta obrigatório: pt-BR')
    expect(system.content).toContain('Você deve responder no idioma definido em <USER_PREFERENCES>')
    expect(system.providerOptions).toBeUndefined()
    // user messages live in `messages`; the system prompt is NOT there.
    const userMessages = args?.messages as Array<{ role: string }>
    expect(userMessages.every((m) => m.role !== 'system')).toBe(true)
  })

  it('adds cacheControl metadata only when the resolved provider is OpenRouter', async () => {
    mockedResolveChatModelForUser.mockResolvedValueOnce({
      model: { modelId: 'anthropic/claude-sonnet-4.6' },
      provider: 'openrouter',
      settings: {},
    })

    await POST(makeRequest({ chatId: 'abc-123', messages: validMessages() }))

    const args = capturedStreamTextArgs.value
    const system = args?.system as {
      providerOptions?: {
        anthropic?: { cacheControl?: { type?: string } }
        openrouter?: { cacheControl?: { type?: string } }
      }
    }

    expect(system.providerOptions?.anthropic?.cacheControl?.type).toBe('ephemeral')
    expect(system.providerOptions?.openrouter?.cacheControl?.type).toBe('ephemeral')
  })

  it('injects the validated external preference directive into the system prompt', async () => {
    await POST(
      makeRequest({
        chatId: 'abc-123',
        messages: validMessages(),
        externalPreference: 'externo',
      }),
    )
    const args = capturedStreamTextArgs.value
    const system = args?.system as { content: string }
    expect(system.content).toContain('Preferência atual da conversa')
    expect(system.content).toContain('priorize sugestões externas')
  })

  it('passes librarianTools containing both expected keys', async () => {
    await POST(makeRequest({ chatId: 'abc-123', messages: validMessages() }))
    const args = capturedStreamTextArgs.value
    const tools = args?.tools as Record<string, unknown>
    expect(tools).toBeDefined()
    expect(Object.keys(tools).sort()).toEqual(
      ['render_external_book_mention', 'render_library_book_card'].sort(),
    )
  })

  it('passes stopWhen (stepCountIs(4)), temperature 0.6, maxOutputTokens 3000', async () => {
    await POST(makeRequest({ chatId: 'abc-123', messages: validMessages() }))
    const args = capturedStreamTextArgs.value
    expect(args?.temperature).toBe(0.6)
    expect(args?.maxOutputTokens).toBe(3000)
    const stopWhen = args?.stopWhen as { __stopWhen?: string; n?: number }
    expect(stopWhen.__stopWhen).toBe('stepCountIs')
    expect(stopWhen.n).toBe(4)
  })

  it('calls consumeStream() (guards onFinish against client abort)', async () => {
    await POST(makeRequest({ chatId: 'abc-123', messages: validMessages() }))
    expect(consumeStreamSpy).toHaveBeenCalled()
  })

  it('onFinish calls saveChat with chatId and messages', async () => {
    await POST(makeRequest({ chatId: 'meu-chat', messages: validMessages() }))
    const opts = capturedToUIMessageStreamResponseOpts.value
    expect(opts?.onFinish).toBeDefined()
    const finalMessages = [{ id: 'a1', role: 'assistant', parts: [{ type: 'text', text: 'Oi!' }] }]
    await opts!.onFinish!({ messages: finalMessages })
    expect(mockedSaveChat).toHaveBeenCalledWith({
      chatId: 'meu-chat',
      messages: finalMessages,
      storageContext: {
        booksDir: '/tmp/books',
        chatsDir: '/tmp/chats',
        dataRoot: '/tmp',
        trailsDir: '/tmp/trails',
        userId: 'user-1',
        userRoot: '/tmp/users/user-1',
      },
    })
  })
})
