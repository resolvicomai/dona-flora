import { normalizeAppLanguage, type AppLanguage } from '@/lib/i18n/app-language'

export type BookLanguageFilter = 'all' | AppLanguage

export function normalizeBookLanguage(input?: string | null): string | undefined {
  const value = input?.trim()
  return value ? value : undefined
}

export function formatBookLanguageLabel(input?: string | null): string | null {
  const value = normalizeBookLanguage(input)
  if (!value) return null

  const lower = value.toLowerCase()
  if (lower === 'pt-br' || lower === 'pt' || lower === 'por' || lower === 'pob') {
    return 'PT-BR'
  }
  if (lower.startsWith('pt-pt')) return 'PT'
  if (lower === 'en' || lower === 'eng' || lower.startsWith('en-')) return 'EN'
  if (lower === 'es' || lower === 'spa' || lower.startsWith('es-')) return 'ES'
  if (
    lower === 'zh' ||
    lower === 'zho' ||
    lower === 'chi' ||
    lower === 'cmn' ||
    lower.startsWith('zh-cn') ||
    lower.startsWith('zh-hans')
  ) {
    return 'ZH-CN'
  }

  return value.toUpperCase()
}

export function normalizeBookLanguageFilter(input?: string | null): BookLanguageFilter {
  const value = input?.trim()
  if (!value || value.toLowerCase() === 'all') {
    return 'all'
  }

  return normalizeAppLanguage(value)
}

export function matchesBookLanguageFilter(
  language?: string | null,
  filter?: string | null,
): boolean {
  const normalizedFilter = normalizeBookLanguageFilter(filter)
  if (normalizedFilter === 'all') {
    return true
  }

  const label = formatBookLanguageLabel(language)
  if (!label) {
    return false
  }

  switch (normalizedFilter) {
    case 'pt-BR':
      return label === 'PT-BR'
    case 'en':
      return label === 'EN'
    case 'es':
      return label === 'ES'
    case 'zh-CN':
      return label === 'ZH-CN'
  }
}

export function resolveGoogleBooksLanguageRestrict(
  filter?: string | null,
): string | undefined {
  const normalizedFilter = normalizeBookLanguageFilter(filter)
  if (normalizedFilter === 'all') {
    return undefined
  }

  switch (normalizedFilter) {
    case 'pt-BR':
      return 'pt'
    case 'en':
      return 'en'
    case 'es':
      return 'es'
    case 'zh-CN':
      return 'zh'
  }
}
