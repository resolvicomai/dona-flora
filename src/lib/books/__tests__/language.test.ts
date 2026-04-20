import {
  formatBookLanguageLabel,
} from '../language'
import { BookSchema } from '../schema'

describe('book language formatting', () => {
  test('maps Portuguese variants to PT-BR label', () => {
    expect(formatBookLanguageLabel('pt-BR')).toBe('PT-BR')
    expect(formatBookLanguageLabel('pt-PT')).toBe('PT')
  })

  test('maps English, Spanish, and Mandarin families to compact labels', () => {
    expect(formatBookLanguageLabel('en-US')).toBe('EN')
    expect(formatBookLanguageLabel('es-MX')).toBe('ES')
    expect(formatBookLanguageLabel('zh-Hans')).toBe('ZH-CN')
  })

  test('keeps unknown upstream codes visible instead of hiding them', () => {
    expect(formatBookLanguageLabel('fr-CA')).toBe('FR-CA')
  })

  test('book schema accepts optional language metadata', () => {
    const parsed = BookSchema.parse({
      title: 'Dom Casmurro',
      author: 'Machado de Assis',
      status: 'lido',
      added_at: '2026-04-20',
      language: 'pt-BR',
    })

    expect(parsed.language).toBe('pt-BR')
  })
})
