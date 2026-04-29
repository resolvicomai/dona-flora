'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { type AppLanguage } from '@/lib/i18n/app-language'
import { cn } from '@/lib/utils'

const APP_LANGUAGE_SWITCH_OPTIONS: Array<{
  label: string
  value: AppLanguage
}> = [
  { label: 'PT', value: 'pt-BR' },
  { label: 'EN', value: 'en' },
  { label: 'ES', value: 'es' },
  { label: '中文', value: 'zh-CN' },
]

export function AppLanguageSwitcher({
  mode = 'remote',
}: {
  mode?: 'local' | 'remote'
}) {
  const router = useRouter()
  const { copy, locale, setLocale } = useAppLanguage()
  const [activeLocale, setActiveLocale] = useState(locale)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setActiveLocale(locale)
  }, [locale])

  async function handleSelect(nextLocale: AppLanguage) {
    if (nextLocale === activeLocale || isSaving) {
      return
    }

    const previousLocale = activeLocale
    setActiveLocale(nextLocale)
    setLocale(nextLocale)

    if (mode === 'local') {
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/settings', {
        body: JSON.stringify({ language: nextLocale }),
        headers: { 'content-type': 'application/json' },
        method: 'PUT',
      })

      if (!response.ok) {
        throw new Error('Failed to persist app language')
      }

      router.refresh()
    } catch (error) {
      void error
      setActiveLocale(previousLocale)
      setLocale(previousLocale)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      role="group"
      aria-label={copy.settings.appLanguageLabel}
      className="brand-chip inline-flex h-10 items-center gap-1 p-1"
    >
      {APP_LANGUAGE_SWITCH_OPTIONS.map((option) => {
        const isActive = option.value === activeLocale
        const title =
          copy.settings.languageOptions.find(
            (languageOption) => languageOption.value === option.value,
          )?.label ?? option.label

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            className={cn(
              'surface-transition inline-flex h-8 min-w-9 items-center justify-center rounded-md px-2.5 font-mono text-[0.74rem] font-medium tracking-normal outline-none focus-visible:border focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
              isActive
                ? 'bg-primary text-primary-foreground shadow-mac-sm'
                : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground',
            )}
            disabled={isSaving}
            onClick={() => void handleSelect(option.value)}
            title={title}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
