'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useLocalStorage } from '@/lib/use-local-storage'
import { APP_LANGUAGE_COPY, type AppLanguageCopy } from './app-language-copy'

import {
  APP_LANGUAGE_STORAGE_KEY,
  DEFAULT_APP_LANGUAGE,
  normalizeAppLanguage,
  resolveHtmlLang,
  SUPPORTED_APP_LANGUAGES,
  type AppLanguage,
} from '@/lib/i18n/app-language'

const defaultCopy = APP_LANGUAGE_COPY[DEFAULT_APP_LANGUAGE]

const AppLanguageContext = createContext<{
  copy: AppLanguageCopy
  locale: AppLanguage
  setLocale: (locale: AppLanguage) => void
}>({
  copy: defaultCopy,
  locale: DEFAULT_APP_LANGUAGE,
  setLocale: () => undefined,
})

export function AppLanguageProvider({
  children,
  locale,
}: {
  children: ReactNode
  locale: string | null | undefined
}) {
  const pathname = usePathname()
  const normalizedLocale = normalizeAppLanguage(locale)
  const [storedLocale, setStoredLocale] = useLocalStorage(
    APP_LANGUAGE_STORAGE_KEY,
    normalizedLocale,
    SUPPORTED_APP_LANGUAGES,
  )
  const isAuthRoute =
    pathname === '/sign-in' ||
    pathname === '/sign-up' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname === '/verify-email'
  const activeLocale = isAuthRoute ? storedLocale : normalizedLocale

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    document.documentElement.lang = resolveHtmlLang(activeLocale)
  }, [activeLocale])

  return (
    <AppLanguageContext.Provider
      value={{
        copy: APP_LANGUAGE_COPY[activeLocale],
        locale: activeLocale,
        setLocale: (nextLocale) => {
          setStoredLocale(nextLocale)
        },
      }}
    >
      {children}
    </AppLanguageContext.Provider>
  )
}

export function useAppLanguage() {
  return useContext(AppLanguageContext)
}
