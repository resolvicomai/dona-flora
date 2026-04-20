import { getDictionary } from '../dictionary'
import { normalizeAppLanguage } from '../app-language'

describe('app language helpers', () => {
  it('normalizes unsupported app locales back to pt-BR', () => {
    expect(normalizeAppLanguage('fr-FR')).toBe('pt-BR')
  })
})

describe('dictionary', () => {
  it('returns English dictionary when app language is en', () => {
    const dictionary = getDictionary('en')

    expect(dictionary.nav.library).toBe('Library')
  })
})
