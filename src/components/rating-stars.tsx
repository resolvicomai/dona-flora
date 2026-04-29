import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AppLanguage } from '@/lib/i18n/app-language'

interface RatingStarsProps {
  value: number
  className?: string
  locale?: AppLanguage
  size?: 'sm' | 'md'
}

const STAR_SIZE = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
} as const

export function RatingStars({
  value,
  className,
  locale = 'pt-BR',
  size = 'sm',
}: RatingStarsProps) {
  const ariaLabel = {
    'pt-BR': `Nota: ${value} de 5`,
    en: `Rating: ${value} out of 5`,
    es: `Nota: ${value} de 5`,
    'zh-CN': `评分：${value}/5`,
  }[locale]

  return (
    <div
      aria-label={ariaLabel}
      className={cn('inline-flex items-center gap-0.5', className)}
      role="img"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          className={cn(
            STAR_SIZE[size],
            star <= value
              ? 'fill-foreground text-foreground'
              : 'text-foreground/18',
          )}
        />
      ))}
    </div>
  )
}
