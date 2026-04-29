'use client'

import { Star } from 'lucide-react'
import { useAppLanguage } from '@/components/app-shell/app-language-provider'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
}

export function StarRating({ value, onChange, readonly }: StarRatingProps) {
  const { locale } = useAppLanguage()
  const copy = {
    'pt-BR': {
      group: 'Avaliação',
      star: (star: number) => `Nota ${star} de 5`,
    },
    en: {
      group: 'Rating',
      star: (star: number) => `Rating ${star} out of 5`,
    },
    es: {
      group: 'Valoración',
      star: (star: number) => `Nota ${star} de 5`,
    },
    'zh-CN': {
      group: '评分',
      star: (star: number) => `${star}/5 评分`,
    },
  }[locale]

  return (
    <div className="brand-chip inline-flex gap-1 p-1.5" role="group" aria-label={copy.group}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          aria-label={copy.star(star)}
          className={cn(
            'surface-transition flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md',
            readonly ? 'cursor-default' : 'cursor-pointer hover:bg-foreground/[0.04]'
          )}
        >
          <Star
            className={cn(
              'h-5 w-5',
              star <= value
                ? 'fill-foreground text-foreground'
                : 'text-foreground/22'
            )}
          />
        </button>
      ))}
    </div>
  )
}
