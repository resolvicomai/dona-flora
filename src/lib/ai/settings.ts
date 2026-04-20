import { z } from 'zod'
import { AppLanguageSchema, normalizeAppLanguage } from '@/lib/i18n/app-language'

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

export const DEFAULT_AI_SETTINGS: AISettings = {
  tone: 'calorosa',
  focus: 'equilibrado',
  externalOpenness: 'sob-demanda',
  responseStyle: 'conversa',
  language: 'pt-BR',
  additionalInstructions: '',
}

export const AI_TONE_OPTIONS = [
  { label: 'Calorosa', value: 'calorosa' },
  { label: 'Analítica', value: 'analitica' },
  { label: 'Assertiva', value: 'assertiva' },
] as const

export const AI_FOCUS_OPTIONS = [
  { label: 'Equilibrado', value: 'equilibrado' },
  { label: 'Memória da sua biblioteca', value: 'memoria' },
  { label: 'Descoberta e repertório', value: 'descoberta' },
] as const

export const AI_EXTERNAL_OPENNESS_OPTIONS = [
  { label: 'Só quando fizer sentido', value: 'sob-demanda' },
  { label: 'Mais aberta a comparações', value: 'aberta' },
  { label: 'Somente acervo por padrão', value: 'somente-acervo' },
] as const

export const AI_RESPONSE_STYLE_OPTIONS = [
  { label: 'Conversa natural', value: 'conversa' },
  { label: 'Mais concisa', value: 'concisa' },
  { label: 'Mais profunda', value: 'profunda' },
] as const

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

export function normalizeAISettings(
  input?: AISettingsInput | null,
): AISettings {
  return AISettingsSchema.parse({
    ...DEFAULT_AI_SETTINGS,
    ...(input ?? {}),
    language: normalizeAppLanguage(input?.language),
    additionalInstructions: input?.additionalInstructions?.trim() ?? '',
  })
}

export function buildAISettingsDirective(
  input?: Partial<AISettings> | null,
): string {
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
