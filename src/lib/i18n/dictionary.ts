import {
  DEFAULT_APP_LANGUAGE,
  normalizeAppLanguage,
  type AppLanguage,
} from './app-language'

export type Dictionary = {
  nav: {
    library: string
    chat: string
  }
}

export const dictionaries: Record<AppLanguage, Dictionary> = {
  'pt-BR': {
    nav: {
      library: 'Biblioteca',
      chat: 'Chat',
    },
  },
  en: {
    nav: {
      library: 'Library',
      chat: 'Chat',
    },
  },
  es: {
    nav: {
      library: 'Biblioteca',
      chat: 'Chat',
    },
  },
  'zh-CN': {
    nav: {
      library: '书库',
      chat: '聊天',
    },
  },
}

export function getDictionary(input?: string | null): Dictionary {
  const locale = normalizeAppLanguage(input)

  return dictionaries[locale] ?? dictionaries[DEFAULT_APP_LANGUAGE]
}
