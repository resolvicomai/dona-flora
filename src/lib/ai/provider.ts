import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import {
  getUserAIPrimaryProviderSecret,
  getUserAIProviderSecret,
  getUserAIProviderSettings,
  type AIProviderSettings,
  type AIPrimaryProvider,
} from '@/lib/auth/db'

export class AIProviderConfigurationError extends Error {
  status = 503
}

export interface OpenAICompatibleModelInfo {
  id: string
}

interface ProviderTestInput {
  apiKey?: string | null
  baseUrl?: string | null
  provider: AIPrimaryProvider
}

interface ProviderTestResult {
  error?: string
  models: OpenAICompatibleModelInfo[]
  ok: boolean
}

export async function listOpenAICompatibleModels(baseUrl: string, apiKey?: string | null) {
  const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/models`, {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
    signal: AbortSignal.timeout(2500),
  })

  if (!response.ok) {
    throw new AIProviderConfigurationError(
      `Servidor local respondeu com status ${response.status}.`,
    )
  }

  const payload = (await response.json()) as {
    data?: Array<{ id?: unknown; name?: unknown }>
  }

  return (payload.data ?? [])
    .map((model) => {
      const id = typeof model.id === 'string' ? model.id : model.name
      return typeof id === 'string' && id.trim()
        ? ({ id: id.trim() } satisfies OpenAICompatibleModelInfo)
        : null
    })
    .filter((model): model is OpenAICompatibleModelInfo => model !== null)
}

async function listOpenAIModels(apiKey: string) {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(4000),
  })

  if (!response.ok) {
    throw new AIProviderConfigurationError(
      `OpenAI respondeu com status ${response.status}. Confira a chave.`,
    )
  }

  const payload = (await response.json()) as {
    data?: Array<{ id?: unknown }>
  }

  return (payload.data ?? [])
    .map((model) =>
      typeof model.id === 'string' && model.id.trim()
        ? ({ id: model.id.trim() } satisfies OpenAICompatibleModelInfo)
        : null,
    )
    .filter((model): model is OpenAICompatibleModelInfo => model !== null)
}

async function listAnthropicModels(apiKey: string) {
  const response = await fetch('https://api.anthropic.com/v1/models', {
    headers: {
      'anthropic-version': '2023-06-01',
      'x-api-key': apiKey,
    },
    signal: AbortSignal.timeout(4000),
  })

  if (!response.ok) {
    throw new AIProviderConfigurationError(
      `Anthropic respondeu com status ${response.status}. Confira a chave.`,
    )
  }

  const payload = (await response.json()) as {
    data?: Array<{ display_name?: unknown; id?: unknown }>
  }

  return (payload.data ?? [])
    .map((model) => {
      const id = typeof model.id === 'string' ? model.id : model.display_name
      return typeof id === 'string' && id.trim()
        ? ({ id: id.trim() } satisfies OpenAICompatibleModelInfo)
        : null
    })
    .filter((model): model is OpenAICompatibleModelInfo => model !== null)
}

async function listOpenRouterModels(apiKey?: string | null) {
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
    signal: AbortSignal.timeout(4000),
  })

  if (!response.ok) {
    throw new AIProviderConfigurationError(`OpenRouter respondeu com status ${response.status}.`)
  }

  const payload = (await response.json()) as {
    data?: Array<{ id?: unknown; name?: unknown }>
  }

  return (payload.data ?? [])
    .map((model) => {
      const id = typeof model.id === 'string' ? model.id : model.name
      return typeof id === 'string' && id.trim()
        ? ({ id: id.trim() } satisfies OpenAICompatibleModelInfo)
        : null
    })
    .filter((model): model is OpenAICompatibleModelInfo => model !== null)
}

export async function testOpenAICompatibleProvider(baseUrl: string, apiKey?: string | null) {
  try {
    const models = await listOpenAICompatibleModels(baseUrl, apiKey)
    return {
      models,
      ok: true as const,
    }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Não foi possível conectar ao provedor local.',
      models: [],
      ok: false as const,
    }
  }
}

export async function testAIProviderConnection({
  apiKey,
  baseUrl,
  provider,
}: ProviderTestInput): Promise<ProviderTestResult> {
  try {
    if (provider === 'ollama' || provider === 'openai-compatible') {
      if (!baseUrl) {
        throw new AIProviderConfigurationError('Informe a URL do provedor.')
      }
      return {
        models: await listOpenAICompatibleModels(baseUrl, apiKey),
        ok: true,
      }
    }

    if (provider === 'openai') {
      if (!apiKey) {
        throw new AIProviderConfigurationError(
          'Cole uma chave da OpenAI ou salve uma chave antes de testar.',
        )
      }
      return { models: await listOpenAIModels(apiKey), ok: true }
    }

    if (provider === 'anthropic') {
      if (!apiKey) {
        throw new AIProviderConfigurationError(
          'Cole um token da Anthropic ou salve uma chave antes de testar.',
        )
      }
      return { models: await listAnthropicModels(apiKey), ok: true }
    }

    return { models: await listOpenRouterModels(apiKey), ok: true }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Não foi possível conectar ao provedor.',
      models: [],
      ok: false,
    }
  }
}

async function isOpenAICompatibleServerReachable(baseUrl: string, apiKey?: string | null) {
  try {
    const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/models`, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
      signal: AbortSignal.timeout(2000),
    })
    return response.ok
  } catch {
    return false
  }
}

function resolveOpenRouterFallback(settings: AIProviderSettings, userId: string) {
  if (!settings.fallbackEnabled) {
    return null
  }

  const apiKey = getUserAIProviderSecret(userId)
  if (!apiKey) {
    return null
  }

  const openrouter = createOpenRouter({ apiKey })
  return {
    model: openrouter(settings.fallbackModel),
    provider: 'openrouter' as const,
    settings,
  }
}

export async function resolveChatModelForUser(userId: string) {
  const settings = getUserAIProviderSettings(userId)

  if (settings.primaryProvider === 'ollama') {
    if (await isOpenAICompatibleServerReachable(settings.ollamaBaseUrl)) {
      const ollama = createOpenAICompatible({
        baseURL: settings.ollamaBaseUrl,
        name: 'ollama',
      })

      return {
        model: ollama(settings.ollamaModel),
        provider: 'ollama' as const,
        settings,
      }
    }

    const fallback = resolveOpenRouterFallback(settings, userId)
    if (fallback) {
      return fallback
    }

    throw new AIProviderConfigurationError(
      'Ollama local não respondeu. Abra o Ollama ou habilite um fallback externo nas settings.',
    )
  }

  if (settings.primaryProvider === 'openai-compatible') {
    const apiKey = getUserAIPrimaryProviderSecret(userId, settings.primaryProvider)
    if (await isOpenAICompatibleServerReachable(settings.compatibleBaseUrl, apiKey)) {
      const compatible = createOpenAICompatible({
        ...(apiKey ? { apiKey } : {}),
        baseURL: settings.compatibleBaseUrl,
        name: 'openai-compatible',
      })

      return {
        model: compatible(settings.compatibleModel),
        provider: 'openai-compatible' as const,
        settings,
      }
    }

    const fallback = resolveOpenRouterFallback(settings, userId)
    if (fallback) {
      return fallback
    }

    throw new AIProviderConfigurationError(
      'O provedor compatível com OpenAI não respondeu. Confira a URL ou habilite um fallback externo.',
    )
  }

  if (settings.primaryProvider === 'openai') {
    const apiKey = getUserAIPrimaryProviderSecret(userId, 'openai')
    if (!apiKey) {
      throw new AIProviderConfigurationError(
        'OpenAI foi escolhida, mas nenhuma chave foi configurada.',
      )
    }
    const openai = createOpenAI({ apiKey })
    return {
      model: openai(settings.openaiModel),
      provider: 'openai' as const,
      settings,
    }
  }

  if (settings.primaryProvider === 'anthropic') {
    const apiKey = getUserAIPrimaryProviderSecret(userId, 'anthropic')
    if (!apiKey) {
      throw new AIProviderConfigurationError(
        'Anthropic foi escolhida, mas nenhum token foi configurado.',
      )
    }
    const anthropic = createAnthropic({ apiKey })
    return {
      model: anthropic(settings.anthropicModel),
      provider: 'anthropic' as const,
      settings,
    }
  }

  if (settings.primaryProvider === 'openrouter') {
    const apiKey =
      getUserAIPrimaryProviderSecret(userId, 'openrouter') ?? getUserAIProviderSecret(userId)
    if (!apiKey) {
      throw new AIProviderConfigurationError(
        'OpenRouter foi escolhido, mas nenhuma chave foi configurada.',
      )
    }
    const openrouter = createOpenRouter({ apiKey })
    return {
      model: openrouter(settings.openrouterModel),
      provider: 'openrouter' as const,
      settings,
    }
  }

  if (await isOpenAICompatibleServerReachable(settings.ollamaBaseUrl)) {
    const ollama = createOpenAICompatible({
      baseURL: settings.ollamaBaseUrl,
      name: 'ollama',
    })

    return {
      model: ollama(settings.ollamaModel),
      provider: 'ollama' as const,
      settings,
    }
  }

  const fallback = resolveOpenRouterFallback(settings, userId)
  if (fallback) {
    return fallback
  }

  throw new AIProviderConfigurationError(
    'Nenhum provedor de IA respondeu. Revise a configuração da Dona Flora.',
  )
}

export function resolveVisionModelForUser(userId: string) {
  const settings = getUserAIProviderSettings(userId)
  if (!settings.visionEnabled) {
    throw new AIProviderConfigurationError(
      'Importação por foto está desabilitada. Habilite a visão externa em Settings.',
    )
  }

  const apiKey =
    getUserAIProviderSecret(userId) ?? getUserAIPrimaryProviderSecret(userId, 'openrouter')
  if (!apiKey) {
    throw new AIProviderConfigurationError(
      'Importação por foto exige uma chave externa configurada pelo usuário.',
    )
  }

  const openrouter = createOpenRouter({ apiKey })
  return {
    model: openrouter(settings.visionModel),
    provider: 'openrouter' as const,
    settings,
  }
}

export function maskAIProviderSettings(settings: AIProviderSettings) {
  return {
    anthropicModel: settings.anthropicModel,
    compatibleBaseUrl: settings.compatibleBaseUrl,
    compatibleModel: settings.compatibleModel,
    fallbackApiKeyConfigured: settings.fallbackApiKeyConfigured,
    fallbackEnabled: settings.fallbackEnabled,
    fallbackModel: settings.fallbackModel,
    fallbackProvider: settings.fallbackProvider,
    ollamaBaseUrl: settings.ollamaBaseUrl,
    ollamaModel: settings.ollamaModel,
    openaiModel: settings.openaiModel,
    openrouterModel: settings.openrouterModel,
    primaryApiKeyConfigured: settings.primaryApiKeyConfigured,
    primaryProvider: settings.primaryProvider,
    visionEnabled: settings.visionEnabled,
    visionModel: settings.visionModel,
  }
}
