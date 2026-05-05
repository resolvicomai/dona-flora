import {
  AIProviderConfigurationError,
  isLikelyChatModel,
  listOpenAICompatibleModels,
  resolveChatModelForUser,
  resolveVisionModelForUser,
} from '@/lib/ai/provider'
import {
  getUserAIPrimaryProviderSecret,
  getUserAIProviderSecret,
  getUserAIProviderSettings,
  type AIProviderSettings,
} from '@/lib/auth/db'

jest.mock('@ai-sdk/openai-compatible', () => ({
  createOpenAICompatible: jest.fn((options: { name: string }) => (modelId: string) => ({
    modelId,
    provider: options.name,
  })),
}))

jest.mock('@openrouter/ai-sdk-provider', () => ({
  createOpenRouter: jest.fn(() => (modelId: string) => ({
    modelId,
    provider: 'openrouter',
  })),
}))

jest.mock('@ai-sdk/openai', () => ({
  createOpenAI: jest.fn(() => (modelId: string) => ({
    modelId,
    provider: 'openai',
  })),
}))

jest.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: jest.fn(() => (modelId: string) => ({
    modelId,
    provider: 'anthropic',
  })),
}))

jest.mock('@/lib/auth/db', () => ({
  getUserAIPrimaryProviderSecret: jest.fn(),
  getUserAIProviderSecret: jest.fn(),
  getUserAIProviderSettings: jest.fn(),
}))

const mockedGetUserAIProviderSettings = getUserAIProviderSettings as jest.MockedFunction<
  typeof getUserAIProviderSettings
>
const mockedGetUserAIProviderSecret = getUserAIProviderSecret as jest.MockedFunction<
  typeof getUserAIProviderSecret
>
const mockedGetUserAIPrimaryProviderSecret = getUserAIPrimaryProviderSecret as jest.MockedFunction<
  typeof getUserAIPrimaryProviderSecret
>
const mockedFetch = jest.fn()

const defaultSettings: AIProviderSettings = {
  anthropicModel: 'claude-sonnet-4-6',
  compatibleBaseUrl: 'http://127.0.0.1:1234/v1',
  compatibleModel: 'local-model',
  fallbackApiKeyConfigured: false,
  fallbackEnabled: false,
  fallbackModel: 'anthropic/claude-sonnet-4.6',
  fallbackProvider: 'openrouter',
  ollamaBaseUrl: 'http://127.0.0.1:11434/v1',
  ollamaModel: 'qwen3.6:27b',
  openaiModel: 'gpt-4.1-mini',
  openrouterModel: 'anthropic/claude-sonnet-4.6',
  primaryApiKeyConfigured: false,
  primaryProvider: 'ollama',
  visionEnabled: false,
  visionModel: 'anthropic/claude-sonnet-4.6',
}

beforeEach(() => {
  mockedFetch.mockReset()
  mockedGetUserAIPrimaryProviderSecret.mockReset()
  mockedGetUserAIProviderSecret.mockReset()
  mockedGetUserAIProviderSettings.mockReturnValue(defaultSettings)
  global.fetch = mockedFetch
})

describe('resolveVisionModelForUser', () => {
  it('requires vision opt-in', () => {
    expect(() => resolveVisionModelForUser('user-1')).toThrow(
      'Importação por foto está desabilitada',
    )
  })

  it('requires a configured external key', () => {
    mockedGetUserAIProviderSettings.mockReturnValue({
      ...defaultSettings,
      visionEnabled: true,
    })

    expect(() => resolveVisionModelForUser('user-1')).toThrow('exige uma chave externa')
  })

  it('uses the configured OpenRouter vision model when enabled', () => {
    mockedGetUserAIProviderSettings.mockReturnValue({
      ...defaultSettings,
      visionEnabled: true,
      visionModel: 'anthropic/claude-sonnet-4.6',
    })
    mockedGetUserAIProviderSecret.mockReturnValue('sk-test')

    const result = resolveVisionModelForUser('user-1')

    expect(result.provider).toBe('openrouter')
    expect(result.model).toMatchObject({
      modelId: 'anthropic/claude-sonnet-4.6',
      provider: 'openrouter',
    })
  })
})

describe('resolveChatModelForUser', () => {
  it('uses Ollama when the local OpenAI-compatible endpoint is reachable', async () => {
    mockedFetch.mockResolvedValue({ ok: true })

    const result = await resolveChatModelForUser('user-1')

    expect(mockedFetch).toHaveBeenCalledWith(
      'http://127.0.0.1:11434/v1/models',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
    expect(result.provider).toBe('ollama')
    expect(result.model).toMatchObject({
      modelId: 'qwen3.6:27b',
      provider: 'ollama',
    })
    expect(mockedGetUserAIProviderSecret).not.toHaveBeenCalled()
  })

  it('uses OpenRouter only when Ollama is unavailable and fallback is enabled with a key', async () => {
    mockedFetch.mockResolvedValue({ ok: false })
    mockedGetUserAIProviderSettings.mockReturnValue({
      ...defaultSettings,
      fallbackApiKeyConfigured: true,
      fallbackEnabled: true,
      fallbackModel: 'openai/gpt-4.1-mini',
    })
    mockedGetUserAIProviderSecret.mockReturnValue('sk-test')

    const result = await resolveChatModelForUser('user-1')

    expect(result.provider).toBe('openrouter')
    expect(result.model).toMatchObject({
      modelId: 'openai/gpt-4.1-mini',
      provider: 'openrouter',
    })
  })

  it('uses OpenAI directly when selected and keyed', async () => {
    mockedGetUserAIProviderSettings.mockReturnValue({
      ...defaultSettings,
      openaiModel: 'gpt-4.1-mini',
      primaryApiKeyConfigured: true,
      primaryProvider: 'openai',
    })
    mockedGetUserAIPrimaryProviderSecret.mockReturnValue('sk-openai')

    const result = await resolveChatModelForUser('user-1')

    expect(result.provider).toBe('openai')
    expect(result.model).toMatchObject({
      modelId: 'gpt-4.1-mini',
      provider: 'openai',
    })
    expect(mockedFetch).not.toHaveBeenCalled()
  })

  it('uses Anthropic directly when selected and keyed', async () => {
    mockedGetUserAIProviderSettings.mockReturnValue({
      ...defaultSettings,
      anthropicModel: 'claude-sonnet-4-6',
      primaryApiKeyConfigured: true,
      primaryProvider: 'anthropic',
    })
    mockedGetUserAIPrimaryProviderSecret.mockReturnValue('sk-ant')

    const result = await resolveChatModelForUser('user-1')

    expect(result.provider).toBe('anthropic')
    expect(result.model).toMatchObject({
      modelId: 'claude-sonnet-4-6',
      provider: 'anthropic',
    })
  })

  it('uses a custom OpenAI-compatible endpoint when selected', async () => {
    mockedFetch.mockResolvedValue({ ok: true })
    mockedGetUserAIProviderSettings.mockReturnValue({
      ...defaultSettings,
      compatibleBaseUrl: 'http://127.0.0.1:1234/v1',
      compatibleModel: 'local-custom',
      primaryProvider: 'openai-compatible',
    })

    const result = await resolveChatModelForUser('user-1')

    expect(mockedFetch).toHaveBeenCalledWith(
      'http://127.0.0.1:1234/v1/models',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
    expect(result.provider).toBe('openai-compatible')
    expect(result.model).toMatchObject({
      modelId: 'local-custom',
      provider: 'openai-compatible',
    })
  })

  it('throws a clear configuration error when Ollama is unavailable and fallback is disabled', async () => {
    mockedFetch.mockRejectedValue(new Error('offline'))

    await expect(resolveChatModelForUser('user-1')).rejects.toBeInstanceOf(
      AIProviderConfigurationError,
    )
    await expect(resolveChatModelForUser('user-1')).rejects.toThrow('Ollama local não respondeu')
  })
})

describe('isLikelyChatModel', () => {
  it.each([
    'chat:latest',
    'flagship:latest',
    'gpt-oss:20b',
    'agente:latest',
    'qwen3.6:35b-a3b',
    'gemma4:26b',
    'gpt-4.1-mini',
    'claude-sonnet-4-6',
    'meta-llama/Llama-3.1-8B-Instruct',
    'deepseek-r1:8b',
  ])('keeps real chat models: %s', (id) => {
    expect(isLikelyChatModel(id)).toBe(true)
  })

  it.each([
    'reranker:latest',
    'dengcao/bge-reranker-v2-m3:latest',
    'embed:latest',
    'embedding:latest',
    'bge-m3:latest',
    'bge-large-en',
    'autocomplete:latest',
    'whisper-1',
    'tts-1',
    'text-embedding-3-large',
  ])('hides specialist non-chat models: %s', (id) => {
    expect(isLikelyChatModel(id)).toBe(false)
  })
})

describe('listOpenAICompatibleModels', () => {
  beforeEach(() => {
    mockedFetch.mockReset()
  })

  it('strips embedding/reranker/autocomplete entries from the response', async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { id: 'reranker:latest' },
          { id: 'embed:latest' },
          { id: 'bge-m3:latest' },
          { id: 'autocomplete:latest' },
          { id: 'chat:latest' },
          { id: 'flagship:latest' },
          { id: 'gpt-oss:20b' },
        ],
      }),
    })

    const models = await listOpenAICompatibleModels('http://127.0.0.1:11434/v1')

    expect(models.map((m) => m.id)).toEqual(['chat:latest', 'flagship:latest', 'gpt-oss:20b'])
  })

  it('throws AIProviderConfigurationError when the server returns non-2xx', async () => {
    mockedFetch.mockResolvedValue({ ok: false, status: 503 })
    await expect(listOpenAICompatibleModels('http://127.0.0.1:11434/v1')).rejects.toBeInstanceOf(
      AIProviderConfigurationError,
    )
  })
})
