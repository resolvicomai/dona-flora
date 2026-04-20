import { z } from 'zod'

export const SUPPORTED_APP_LANGUAGES = ['pt-BR', 'en', 'es', 'zh-CN'] as const

export const AppLanguageSchema = z.enum(SUPPORTED_APP_LANGUAGES)

export type AppLanguage = z.infer<typeof AppLanguageSchema>

export const DEFAULT_APP_LANGUAGE: AppLanguage = 'pt-BR'

export function normalizeAppLanguage(input?: string | null): AppLanguage {
  const parsed = AppLanguageSchema.safeParse(input)

  if (parsed.success) {
    return parsed.data
  }

  const normalized = input?.trim().replace(/_/g, '-').toLowerCase()

  if (!normalized) {
    return DEFAULT_APP_LANGUAGE
  }

  if (normalized.startsWith('pt')) {
    return 'pt-BR'
  }

  if (normalized.startsWith('en')) {
    return 'en'
  }

  if (normalized.startsWith('es')) {
    return 'es'
  }

  if (normalized.startsWith('zh')) {
    return 'zh-CN'
  }

  return DEFAULT_APP_LANGUAGE
}

export function resolveHtmlLang(input?: string | null): AppLanguage {
  return normalizeAppLanguage(input)
}
