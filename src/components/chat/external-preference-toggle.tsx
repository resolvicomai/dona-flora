'use client'

import type { ExternalPreference } from '@/lib/ai/external-preference'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { cn } from '@/lib/utils'
import { getChatCopy } from './chat-language'

interface ExternalPreferenceToggleProps {
  value: ExternalPreference | null
  onChange: (value: ExternalPreference) => void
}

const ORDER: ExternalPreference[] = ['acervo', 'ambos', 'externo']

export function ExternalPreferenceToggle({ value, onChange }: ExternalPreferenceToggleProps) {
  const { locale } = useAppLanguage()
  const copy = getChatCopy(locale).externalPreference

  return (
    <div className="mb-3 flex flex-col gap-2" aria-live="polite">
      <span className="sr-only">{copy.optionsAriaHint}</span>
      <span className="eyebrow">{copy.eyebrow}</span>
      <div
        role="radiogroup"
        aria-label={copy.groupAria}
        className="brand-chip inline-flex w-fit items-center p-1"
      >
        {ORDER.map((key) => {
          const option = copy.options[key]
          const isActive = value === key

          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={option.aria}
              className={cn(
                'surface-transition rounded-md px-3.5 py-2 text-xs font-medium',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground',
              )}
              onClick={() => onChange(key)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
