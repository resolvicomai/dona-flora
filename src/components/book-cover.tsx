import Image from 'next/image'
import { cn } from '@/lib/utils'

interface BookCoverProps {
  src?: string
  alt: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: { width: 48, height: 72 },    // home page list item
  md: { width: 128, height: 192 },  // mobile detail
  lg: { width: 192, height: 288 },  // desktop detail
}

const INITIAL_SIZE: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-4xl',
}

/**
 * @param alt - Book title. Used both as accessible text (<img alt>) and as the
 * visible first-initial character in the fallback placeholder.
 */
export function BookCover({ src, alt, size = 'md', className }: BookCoverProps) {
  const { width, height } = SIZES[size]

  if (!src) {
    const trimmed = alt.trim()
    const initial = trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : '?'
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-border/60 bg-gradient-to-br from-secondary via-background to-muted shadow-mac-sm',
          className,
        )}
        style={{ width, height }}
        aria-label={`Capa de ${alt || 'livro'} não disponível`}
        role="img"
      >
        <span className={cn('font-medium text-foreground', INITIAL_SIZE[size])}>
          {initial}
        </span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={`${alt} - capa`}
      width={width}
      height={height}
      className={cn('rounded-lg object-cover shadow-mac-sm', className)}
    />
  )
}
