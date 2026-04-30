import { z } from 'zod'
import { AppLanguageSchema, normalizeAppLanguage, type AppLanguage } from '@/lib/i18n/app-language'

export const AISettingsSchema = z.object({
  tone: z.enum(['calorosa', 'analitica', 'assertiva']),
  focus: z.enum(['equilibrado', 'memoria', 'descoberta']),
  externalOpenness: z.enum(['sob-demanda', 'aberta', 'somente-acervo']),
  responseStyle: z.enum(['conversa', 'concisa', 'profunda']),
  language: AppLanguageSchema,
  additionalInstructions: z.string().max(500),
})

export type AISettings = z.infer<typeof AISettingsSchema>

export type AISettingsInput = Partial<Omit<AISettings, 'language'>> & {
  language?: string | null
}

type Option<T extends string> = {
  label: string
  value: T
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  tone: 'calorosa',
  focus: 'equilibrado',
  externalOpenness: 'sob-demanda',
  responseStyle: 'conversa',
  language: 'pt-BR',
  additionalInstructions: '',
}

const AI_TONE_VALUES = ['calorosa', 'analitica', 'assertiva'] as const
const AI_FOCUS_VALUES = ['equilibrado', 'memoria', 'descoberta'] as const
const AI_EXTERNAL_OPENNESS_VALUES = ['sob-demanda', 'aberta', 'somente-acervo'] as const
const AI_RESPONSE_STYLE_VALUES = ['conversa', 'concisa', 'profunda'] as const

const AI_OPTION_LABELS: Record<
  AppLanguage,
  {
    externalOpenness: Record<AISettings['externalOpenness'], string>
    focus: Record<AISettings['focus'], string>
    responseStyle: Record<AISettings['responseStyle'], string>
    tone: Record<AISettings['tone'], string>
  }
> = {
  'pt-BR': {
    tone: {
      calorosa: 'Calorosa',
      analitica: 'Analítica',
      assertiva: 'Assertiva',
    },
    focus: {
      equilibrado: 'Equilibrado',
      memoria: 'Memória da sua biblioteca',
      descoberta: 'Descoberta e repertório',
    },
    externalOpenness: {
      'sob-demanda': 'Só quando fizer sentido',
      aberta: 'Mais aberta a comparações',
      'somente-acervo': 'Somente acervo por padrão',
    },
    responseStyle: {
      conversa: 'Conversa natural',
      concisa: 'Mais concisa',
      profunda: 'Mais profunda',
    },
  },
  en: {
    tone: {
      calorosa: 'Warm',
      analitica: 'Analytical',
      assertiva: 'Assertive',
    },
    focus: {
      equilibrado: 'Balanced',
      memoria: 'Your library memory',
      descoberta: 'Discovery and repertoire',
    },
    externalOpenness: {
      'sob-demanda': 'Only when it makes sense',
      aberta: 'More open to comparisons',
      'somente-acervo': 'Library only by default',
    },
    responseStyle: {
      conversa: 'Natural conversation',
      concisa: 'More concise',
      profunda: 'More in depth',
    },
  },
  es: {
    tone: {
      calorosa: 'Cálida',
      analitica: 'Analítica',
      assertiva: 'Asertiva',
    },
    focus: {
      equilibrado: 'Equilibrado',
      memoria: 'Memoria de tu biblioteca',
      descoberta: 'Descubrimiento y repertorio',
    },
    externalOpenness: {
      'sob-demanda': 'Solo cuando tenga sentido',
      aberta: 'Más abierta a comparaciones',
      'somente-acervo': 'Solo biblioteca por defecto',
    },
    responseStyle: {
      conversa: 'Conversación natural',
      concisa: 'Más concisa',
      profunda: 'Más profunda',
    },
  },
  'zh-CN': {
    tone: {
      calorosa: '温暖',
      analitica: '分析型',
      assertiva: '果断',
    },
    focus: {
      equilibrado: '平衡',
      memoria: '你的书库记忆',
      descoberta: '发现与拓展',
    },
    externalOpenness: {
      'sob-demanda': '仅在合适时',
      aberta: '更开放地比较',
      'somente-acervo': '默认只看书库',
    },
    responseStyle: {
      conversa: '自然对话',
      concisa: '更简洁',
      profunda: '更深入',
    },
  },
}

function buildOptions<T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
): Array<Option<T>> {
  return values.map((value) => ({
    label: labels[value],
    value,
  }))
}

export function getAIToneOptions(locale: AppLanguage = 'pt-BR') {
  return buildOptions(AI_TONE_VALUES, AI_OPTION_LABELS[locale].tone)
}

export function getAIFocusOptions(locale: AppLanguage = 'pt-BR') {
  return buildOptions(AI_FOCUS_VALUES, AI_OPTION_LABELS[locale].focus)
}

export function getAIExternalOpennessOptions(locale: AppLanguage = 'pt-BR') {
  return buildOptions(AI_EXTERNAL_OPENNESS_VALUES, AI_OPTION_LABELS[locale].externalOpenness)
}

export function getAIResponseStyleOptions(locale: AppLanguage = 'pt-BR') {
  return buildOptions(AI_RESPONSE_STYLE_VALUES, AI_OPTION_LABELS[locale].responseStyle)
}

export const AI_TONE_OPTIONS = getAIToneOptions()
export const AI_FOCUS_OPTIONS = getAIFocusOptions()
export const AI_EXTERNAL_OPENNESS_OPTIONS = getAIExternalOpennessOptions()
export const AI_RESPONSE_STYLE_OPTIONS = getAIResponseStyleOptions()

export const AI_LANGUAGE_OPTIONS = [
  { label: 'Português (Brasil)', value: 'pt-BR' },
  { label: 'English', value: 'en' },
  { label: 'Español', value: 'es' },
  { label: '中文（简体）', value: 'zh-CN' },
] as const

export function getAIOptionLabel<T extends string>(
  options: ReadonlyArray<{ label: string; value: T }>,
  value: T | null | undefined,
  fallback: string,
) {
  if (value == null) {
    return fallback
  }

  return options.find((option) => option.value === value)?.label ?? fallback
}

const toneLabels: Record<AISettings['tone'], string> = {
  calorosa: 'calorosa',
  analitica: 'analítica',
  assertiva: 'assertiva',
}

const focusLabels: Record<AISettings['focus'], string> = {
  equilibrado: 'equilibrado',
  memoria: 'memória',
  descoberta: 'descoberta',
}

const externalLabels: Record<AISettings['externalOpenness'], string> = {
  'sob-demanda': 'somente quando fizer sentido e houver abertura',
  aberta: 'abertos, desde que fique claro o que não está na biblioteca',
  'somente-acervo': 'somente quando o usuário pedir',
}

const responseLabels: Record<AISettings['responseStyle'], string> = {
  conversa: 'conversa',
  concisa: 'concisa',
  profunda: 'profunda',
}

const responseLanguageLabels: Record<AISettings['language'], string> = {
  'pt-BR': 'pt-BR',
  en: 'en',
  es: 'es',
  'zh-CN': 'zh-CN',
}

export function normalizeAISettings(input?: AISettingsInput | null): AISettings {
  return AISettingsSchema.parse({
    ...DEFAULT_AI_SETTINGS,
    ...(input ?? {}),
    language: normalizeAppLanguage(input?.language),
    additionalInstructions: input?.additionalInstructions?.trim() ?? '',
  })
}

export function buildAISettingsDirective(input?: Partial<AISettings> | null): string {
  const settings = normalizeAISettings(input)

  const lines = [
    `Tom preferido: ${toneLabels[settings.tone]}`,
    `Foco preferido: ${focusLabels[settings.focus]}`,
    `Livros externos: ${externalLabels[settings.externalOpenness]}`,
    `Estilo de resposta: ${responseLabels[settings.responseStyle]}`,
    `Idioma da interface: ${settings.language}`,
    `Idioma de resposta obrigatório: ${responseLanguageLabels[settings.language]}`,
  ]

  if (settings.additionalInstructions) {
    lines.push(`Instruções adicionais: ${settings.additionalInstructions}`)
  }

  return lines.join('\n')
}
