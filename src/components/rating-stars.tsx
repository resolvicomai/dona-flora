import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  value: number
  className?: string
  size?: 'sm' | 'md'
}

const STAR_SIZE = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
} as const

export function RatingStars({
  value,
  className,
  size = 'sm',
}: RatingStarsProps) {
  return (
    <div
      aria-label={`Nota: ${value} de 5`}
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
