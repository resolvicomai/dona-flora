"use client"

import type { ExternalPreference } from '@/lib/ai/external-preference'
import { cn } from '@/lib/utils'

interface ExternalPreferenceToggleProps {
  value: ExternalPreference | null
  onChange: (value: ExternalPreference) => void
}

const OPTIONS: Array<{
  ariaLabel: string
  label: string
  value: ExternalPreference
}> = [
  {
    ariaLabel: 'Recomendar apenas do meu acervo',
    label: 'Acervo',
    value: 'acervo',
  },
  {
    ariaLabel: 'Recomendar do acervo ou externos',
    label: 'Ambos',
    value: 'ambos',
  },
  {
    ariaLabel: 'Recomendar apenas externos',
    label: 'Externo',
    value: 'externo',
  },
]

export function ExternalPreferenceToggle({
  value,
  onChange,
}: ExternalPreferenceToggleProps) {
  return (
    <div className="mb-2 flex flex-col gap-1" aria-live="polite">
      <span className="sr-only">Opções de preferência disponíveis.</span>
      <span className="text-xs text-muted-foreground">
        Preferência de recomendação
      </span>
      <div
        role="radiogroup"
        aria-label="Preferência de recomendação"
        className="inline-flex w-fit items-center rounded-full bg-secondary p-0.5"
      >
        {OPTIONS.map((option) => {
          const isActive = value === option.value

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={option.ariaLabel}
              className={cn(
                'surface-transition rounded-full px-3 py-1 text-xs font-medium',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
