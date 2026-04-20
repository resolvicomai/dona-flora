import { z } from 'zod'

export const SUPPORTED_APP_LANGUAGES = ['pt-BR', 'en', 'es', 'zh-CN'] as const

export const AppLanguageSchema = z.enum(SUPPORTED_APP_LANGUAGES)

export type AppLanguage = z.infer<typeof AppLanguageSchema>

export const DEFAULT_APP_LANGUAGE: AppLanguage = 'pt-BR'

export function normalizeAppLanguage(input?: string | null): AppLanguage {
  const parsed = AppLanguageSchema.safeParse(input)

  return parsed.success ? parsed.data : DEFAULT_APP_LANGUAGE
}

export function resolveHtmlLang(input?: string | null): AppLanguage {
  return normalizeAppLanguage(input)
}
