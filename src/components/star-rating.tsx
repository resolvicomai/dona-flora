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
    <div className="flex gap-1" role="group" aria-label="Avaliacao">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          aria-label={`Nota ${star} de 5`}
          className={cn(
            'min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors',
            readonly ? 'cursor-default' : 'cursor-pointer hover:text-yellow-400'
          )}
        >
          <Star
            className={cn(
              'h-5 w-5',
              star <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-zinc-600'
            )}
          />
        </button>
      ))}
    </div>
  )
}
