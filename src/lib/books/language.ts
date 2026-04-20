export function normalizeBookLanguage(input?: string | null): string | undefined {
  const value = input?.trim()
  return value ? value : undefined
}

export function formatBookLanguageLabel(input?: string | null): string | null {
  const value = normalizeBookLanguage(input)
  if (!value) return null

  const lower = value.toLowerCase()
  if (lower === 'pt-br') return 'PT-BR'
  if (lower.startsWith('pt-pt')) return 'PT'
  if (lower === 'en' || lower.startsWith('en-')) return 'EN'
  if (lower === 'es' || lower.startsWith('es-')) return 'ES'
  if (lower === 'zh' || lower.startsWith('zh-cn') || lower.startsWith('zh-hans')) {
    return 'ZH-CN'
  }

  return value.toUpperCase()
}
