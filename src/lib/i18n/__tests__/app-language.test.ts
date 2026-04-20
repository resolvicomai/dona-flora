import { normalizeAppLanguage } from '@/lib/i18n/app-language'

describe('normalizeAppLanguage', () => {
  it('keeps supported locales unchanged', () => {
    expect(normalizeAppLanguage('pt-BR')).toBe('pt-BR')
    expect(normalizeAppLanguage('en')).toBe('en')
    expect(normalizeAppLanguage('es')).toBe('es')
    expect(normalizeAppLanguage('zh-CN')).toBe('zh-CN')
  })

  it('maps legacy or regional variants to the supported app locales', () => {
    expect(normalizeAppLanguage('en-US')).toBe('en')
    expect(normalizeAppLanguage('en_GB')).toBe('en')
    expect(normalizeAppLanguage('es-MX')).toBe('es')
    expect(normalizeAppLanguage('pt-PT')).toBe('pt-BR')
    expect(normalizeAppLanguage('zh-Hans')).toBe('zh-CN')
  })

  it('falls back to pt-BR for unknown values', () => {
    expect(normalizeAppLanguage('fr-FR')).toBe('pt-BR')
    expect(normalizeAppLanguage(undefined)).toBe('pt-BR')
  })
})
