import {
  DEFAULT_AI_SETTINGS,
  AI_LANGUAGE_OPTIONS,
  buildAISettingsDirective,
  AISettingsSchema,
  getAIOptionLabel,
  normalizeAISettings,
  getAIExternalOpennessOptions,
  getAIResponseStyleOptions,
  getAIToneOptions,
} from '@/lib/ai/settings'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'

describe('normalizeAISettings', () => {
  it('fills missing values with the product defaults', () => {
    expect(normalizeAISettings({ tone: 'analitica' })).toEqual({
      ...DEFAULT_AI_SETTINGS,
      tone: 'analitica',
    })
  })
})

describe('AISettingsSchema', () => {
  it('rejects unsupported UI locale values', () => {
    expect(() =>
      AISettingsSchema.parse({
        tone: 'calorosa',
        focus: 'equilibrado',
        externalOpenness: 'sob-demanda',
        responseStyle: 'conversa',
        language: 'fr-FR',
        additionalInstructions: '',
      }),
    ).toThrow()
  })
})

describe('AI_LANGUAGE_OPTIONS', () => {
  it('lists only supported app locales', () => {
    expect(AI_LANGUAGE_OPTIONS.map((option) => option.value)).toEqual([
      'pt-BR',
      'en',
      'es',
      'zh-CN',
    ])
  })
})

describe('buildAISettingsDirective', () => {
  it('renders a stable pt-BR preference block for the system prompt', () => {
    const directive = buildAISettingsDirective({
      tone: 'analitica',
      focus: 'descoberta',
      externalOpenness: 'somente-acervo',
      responseStyle: 'profunda',
      language: 'en',
      additionalInstructions: 'Sempre explique o porquê das recomendações.',
    })

    expect(directive).toContain('Tom preferido: analítica')
    expect(directive).toContain('Foco preferido: descoberta')
    expect(directive).toContain('Livros externos: somente quando o usuário pedir')
    expect(directive).toContain('Estilo de resposta: profunda')
    expect(directive).toContain('Idioma da interface: en')
    expect(directive).toContain('Idioma de resposta obrigatório: en')
    expect(directive).toContain(
      'Instruções adicionais: Sempre explique o porquê das recomendações.',
    )
  })

  it('builds a mandatory response-language directive from the supported app locale', () => {
    const directive = buildAISettingsDirective({
      tone: 'calorosa',
      focus: 'equilibrado',
      externalOpenness: 'sob-demanda',
      responseStyle: 'conversa',
      language: 'zh-CN',
      additionalInstructions: '',
    })

    expect(directive).toContain('Idioma da interface: zh-CN')
    expect(directive).toContain('Idioma de resposta obrigatório: zh-CN')
  })
})

describe('buildSystemPrompt with user settings', () => {
  it('appends user preferences before the <LIBRARY> block', () => {
    const output = buildSystemPrompt('BIBLIOTECA', {
      externalPreferenceDirective: 'Prefira livros do acervo nesta conversa.',
      aiSettingsDirective: 'Tom preferido: calorosa\nIdioma de resposta obrigatório: es',
    })

    expect(output).toContain(
      '<CONVERSATION_PREFERENCE>\nPrefira livros do acervo nesta conversa.\n</CONVERSATION_PREFERENCE>',
    )
    expect(output).toContain(
      '<USER_PREFERENCES>\nTom preferido: calorosa\nIdioma de resposta obrigatório: es\n</USER_PREFERENCES>',
    )
    expect(output).toContain('<LIBRARY>\nBIBLIOTECA\n</LIBRARY>')
    expect(output).toContain('Você deve responder no idioma definido em <USER_PREFERENCES>')
    expect(output.indexOf('<USER_PREFERENCES>')).toBeLessThan(output.lastIndexOf('<LIBRARY>'))
  })
})

describe('getAIOptionLabel', () => {
  it('returns the display label for the currently selected option', () => {
    expect(getAIOptionLabel(getAIExternalOpennessOptions('pt-BR'), 'sob-demanda', 'Fallback')).toBe(
      'Só quando fizer sentido',
    )
  })
})

describe('localized AI options', () => {
  it('renders tone and response-style labels in English when requested', () => {
    expect(getAIToneOptions('en')).toEqual([
      { label: 'Warm', value: 'calorosa' },
      { label: 'Analytical', value: 'analitica' },
      { label: 'Assertive', value: 'assertiva' },
    ])

    expect(getAIResponseStyleOptions('en')).toEqual([
      { label: 'Natural conversation', value: 'conversa' },
      { label: 'More concise', value: 'concisa' },
      { label: 'More in depth', value: 'profunda' },
    ])
  })
})
