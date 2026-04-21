'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
}

export function StarRating({ value, onChange, readonly }: StarRatingProps) {
  return (
    <div className="glass-pill inline-flex gap-1 rounded-full p-1.5" role="group" aria-label="Avaliacao">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          aria-label={`Nota ${star} de 5`}
          className={cn(
            'surface-transition flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full',
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
